import { OpenAPIObject } from '@nestjs/swagger';

let swaggerDocument: OpenAPIObject;

export function setSwaggerDocument(document: OpenAPIObject): void {
  swaggerDocument = document;
}

export function getSwaggerDocument(): OpenAPIObject {
  return swaggerDocument;
}
