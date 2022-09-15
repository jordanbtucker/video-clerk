const {immediate} = require('./util')

/**
 * @typedef MockInquirerPackageState
 * @property {MockInquirerPackageStateAnswer[]} [answers]
 */

/**
 * @typedef MockInquirerPackageStateAnswer
 * @property {import('inquirer').Question<MockInquirerPackageAnswers>} question
 * @property {MockInquirerPackageAnswer} answer
 */

/**
 * @typedef {Record<string, MockInquirerPackageAnswer>} MockInquirerPackageAnswers
 */

/**
 * @typedef {string | number | boolean | string[] | null} MockInquirerPackageAnswer
 */

/**
 * @param {MockInquirerPackageState} [state]
 */
function createMockInquirerPackage(state) {
  return new MockInquirerPackage(state)
}

class MockInquirerPackage {
  /**
   * @param {MockInquirerPackageState} state
   */
  constructor(state) {
    this._answers = (state && state.answers) || []
  }

  /**
   * @param {import('inquirer').Question<MockInquirerPackageAnswers>[]} questions
   */
  async prompt(questions) {
    /** @type {MockInquirerPackageAnswers} */
    const answers = {}
    for (const question of questions) {
      answers[question.name] = question.default

      for (const answer of this._answers) {
        if (
          answer.question.type === question.type &&
          answer.question.name === question.name &&
          answer.question.message === question.message
        ) {
          answers[question.name] = answer.answer
          break
        }
      }

      /** @type {MockInquirerPackageAnswer} */
      const answer = answers[question.name]

      if (answer === undefined) {
        throw new Error(`Test cannot answer question: ${question.message}`)
      }

      if (
        question.type === 'input' &&
        typeof answer !== 'string' &&
        answer !== null
      ) {
        throw new Error(
          `Test question expected a string or null: ${question.message} = ${answer}`,
        )
      }

      if (
        question.type === 'confirm' &&
        typeof answer !== 'boolean' &&
        answer !== null
      ) {
        throw new Error(
          `Test question expected a boolean or null: ${question.message} = ${answer}`,
        )
      }

      if (
        question.type === 'list' &&
        typeof answer !== 'string' &&
        typeof answer !== 'number' &&
        answer !== null
      ) {
        throw new Error(
          `Test question expected a string, number, or null: ${question.message} = ${answer}`,
        )
      }

      if (question.type === 'checkbox' && !Array.isArray(answer)) {
        throw new Error(
          `Test question expected an array: ${question.message} = ${answer}`,
        )
      }

      if (question.type === 'list' || question.type === 'checkbox') {
        /** @type {(string | import('inquirer').DistinctChoice<MockInquirerPackageAnswers>)[]} */
        const choices =
          typeof question.choices === 'function'
            ? await question.choices()
            : question.choices

        if (choices == null) {
          throw new Error(`Test question has no choices: ${question.message}`)
        }

        const chosenAnswers = Array.isArray(answer) ? answer : [answer]

        for (const chosenAnswer of chosenAnswers) {
          const choice = choices.find(
            choice => chosenAnswer === choice || chosenAnswer === choice.value,
          )
          if (choice == null) {
            throw new Error(
              `Test answer is not a valid choice: ${question.message} = ${chosenAnswer}`,
            )
          }
        }
      }
    }

    return immediate(answers)
  }
}

module.exports = {
  createMockInquirerPackage,
}
