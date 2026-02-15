# Runner API Contract (Developer A → Developer B)

Host:
http://127.0.0.1:3030

Endpoint:
POST /infer

Request Body:
{
  "text": "string"
}

Success Response:
{
  "level": "LOW" | "MED" | "HIGH",
  "confidence": number,
  "inference_ms": number,
  "on_device": true
}

Error Response:
{
  "error": "string"
}