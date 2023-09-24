class ObjectTransformer<T> {
  private transformers: Array<{
    field: string
    apply: (value) => unknown
  }> = []

  schema(schemaInput: Record<string, FieldTransformer>) {
    this.transformers = Object.entries(schemaInput).map(field => ({
      field: field[0],
      apply: field[1].getPipeline(),
    }))
    return this
  }

  parse(payload): T {
    const newObj = {}

    this.transformers.forEach(transformer => {
      newObj[transformer.field] = transformer.apply(payload[transformer.field])
    })

    return newObj as T
  }
}

class SchemaInitializer {
  string() {
    return new FieldTransformer().string()
  }

  int() {
    return new FieldTransformer().int()
  }

  float() {
    return new FieldTransformer().float()
  }

  object<T = any>() {
    return new ObjectTransformer<T>()
  }
}

class FieldTransformer {
  private pipeline: ((value: string) => unknown)[] = []

  string() {
    this.pipeline.push(value => value)
    return this
  }

  int() {
    this.pipeline.push(value => parseInt(value))
    return this
  }

  float() {
    this.pipeline.push(value => parseFloat(value))
    return this
  }

  getPipeline() {
    return this.pipeline[0]
  }
}

export const t = new SchemaInitializer()
