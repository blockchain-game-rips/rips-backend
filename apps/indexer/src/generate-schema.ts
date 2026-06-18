import { printSchema } from 'graphql';
import { SchemaBuilder } from '@subsquid/openreader/lib/dialect/opencrud/schema';
import { loadModel } from '@subsquid/openreader/lib/tools';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const outputDir = join(__dirname, '../generated');
const model = loadModel(join(__dirname, '../schema.graphql'));
const schema = new SchemaBuilder({ model }).build();

mkdirSync(outputDir, { recursive: true });
writeFileSync(join(outputDir, 'schema.graphql'), printSchema(schema));
