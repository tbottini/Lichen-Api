type StepTransformer = (
  value: string,
  context: { stop: () => void; error: (errorValue: string) => void }
) => unknown

class ObjectTransformer<T> {
  private transformers: Array<{
    field: string
    apply: StepTransformer
  }> = []

  schema(schemaInput: Record<string, FieldTransformer>) {
    this.transformers = Object.entries(schemaInput).map(
      ([attribute, plan]) => ({
        field: attribute,
        apply: plan.getPipeline(),
      })
    )
    return this
  }

  parse(payload): T {
    const newObj = {}

    const contextState = {
      errors: [] as string[],
    }

    this.transformers.forEach(transformer => {
      newObj[transformer.field] = transformer.apply(
        payload[transformer.field],
        {
          error: errorString =>
            contextState.errors.push(transformer.field + ': ' + errorString),
          stop: () => {},
        }
      )
    })

    if (contextState.errors.length) {
      throw new Error(
        `Validation errors :\n${contextState.errors
          .map(e => '- ' + e)
          .join('\n')}`
      )
    }

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

  boolean() {
    return new FieldTransformer().boolean()
  }

  optional() {
    return new FieldTransformer().optionnal()
  }

  required() {
    return new FieldTransformer().required()
  }

  object<T = any>() {
    return new ObjectTransformer<T>()
  }
}

class FieldTransformer {
  private pipeline: StepTransformer[] = []
  private optionnalityIsDefined = false

  optionnal() {
    this.optionnalityIsDefined = true
    this.pipeline.push((value, context) => {
      console.log('optional', value)
      if (value === undefined) {
        context.stop()
        return
      }
      return value
    })
    return this
  }

  required() {
    this.optionnalityIsDefined = true
    this.pipeline.push((value, context) => {
      if (value === undefined) {
        context.error('Value is undefined')
      }
      return value
    })
    return this
  }

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

  boolean() {
    this.pipeline.push(
      value => value == 'true' || value == 'True' || value == 't'
    )
    return this
  }

  getPipeline(): StepTransformer {
    if (!this.optionnalityIsDefined) {
      const pipelineTmp = this.pipeline
      this.pipeline = []
      this.optionnal()
      this.pipeline = [...this.pipeline, ...pipelineTmp]
    }

    return (value, context) => {
      const contextValue = {
        errorValue: null as string | null,
        mustBeStopped: false,
      }

      const contextModel = {
        error: errorString => {
          contextValue.errorValue = errorString
          contextValue.mustBeStopped = true
        },
        stop: () => (contextValue.mustBeStopped = true),
      }

      let parsedValue = value as unknown
      let mustContinue = true
      let i = 0
      while (mustContinue) {
        if (i >= this.pipeline.length) {
          break
        }
        const step = this.pipeline[i]
        parsedValue = step(parsedValue as string, contextModel)

        if (contextValue.mustBeStopped) {
          if (contextValue.errorValue) {
            context.error(contextValue.errorValue)
          }
          break
        }
        i++
      }

      return parsedValue
    }
  }
}

export const t = new SchemaInitializer()
