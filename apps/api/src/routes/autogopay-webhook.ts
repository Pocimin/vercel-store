import type { FastifyInstance, FastifyRequest } from "fastify";
import { PaymentStatus, db } from "@nznt/db";
import { verifyAutogopaySignature } from "../lib/autogopay.js";
import { resolveQrisPayment } from "./purchases.js";

type AutogopayTransaction = {
  transaction_id?: string;
  order_id?: string;
  amount?: number;
  status?: string;
  payment_method?: string;
  paid_at?: string;
};

type AutogopayWebhookPayload = {
  event?: string;
  timestamp?: string | number;
  transaction?: AutogopayTransaction;
};

function rawJsonParser(request: FastifyRequest, rawBody: Buffer, done: (err: Error | null, value?: unknown) => void) {
  (request as FastifyRequest & { rawBody?: Buffer }).rawBody = rawBody;
  (request.raw as { rawBody?: Buffer }).rawBody = rawBody;
  try {
    done(null, JSON.parse(rawBody.toString("utf8")));
  } catch (error) {
    (error as Error & { statusCode?: number }).statusCode = 400;
    done(error as Error);
  }
}

export function registerAutogopayWebhook(app: FastifyInstance) {
  app.addContentTypeParser("application/json", { parseAs: "buffer" }, rawJsonParser);

  app.post("/webhooks/autogopay", async (request, reply) => {
    try {
      const req = request as FastifyRequest & { rawBody?: Buffer };
      const rawBody = req.rawBody ?? (request.raw as { rawBody?: Buffer }).rawBody;
      const signatureHeader = Array.isArray(request.headers["x-signature"]) ? request.headers["x-signature"][0] : request.headers["x-signature"];
      if (!rawBody || !verifyAutogopaySignature(rawBody, signatureHeader)) {
        return reply.status(200).send({ success: false, message: "invalid signature" });
      }

      const payload = (request.body ?? {}) as AutogopayWebhookPayload;
      const paid = payload?.event === "transaction.received" && payload?.transaction?.status?.toUpperCase() === "PAID";
      const orderSn = payload?.transaction?.order_id;
      if (paid && orderSn) {
        const payment = await db.payment.findFirst({
          where: { orderSn },
          select: { id: true, status: true }
        });
        if (payment && (payment.status === PaymentStatus.PENDING || payment.status === PaymentStatus.EXPIRED)) {
          const resolved = await resolveQrisPayment(payment.id, payload.transaction?.paid_at);
          request.log.info({ paymentId: payment.id, orderSn, resolved: Boolean(resolved) }, "autogopay webhook resolved payment");
        }
      }

      return reply.status(200).send({ success: true });
    } catch (error) {
      request.log.error(error, "autogopay webhook failed");
      return reply.status(200).send({ success: false, message: "internal error" });
    }
  });
}
