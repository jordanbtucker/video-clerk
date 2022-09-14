const {immediate} = require('./util')

/**
 * @typedef MockInquirerPackageState
 * @property {MockInquirerPackageStateAnswer[]} [answers]
 */

/**
 * @typedef MockInquirerPackageStateAnswer
 * @property {import('inquirer').Question} question
 * @property {unknown} answer
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
   * @param {import('inquirer').Question[]} questions
   */
  async prompt(questions) {
    const answers = {}
    for (const question of questions) {
      if (typeof question.choices === 'function') {
        await question.choices()
      }

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

      if (answers[question.name] == null) {
        throw new Error(`Test cannot answer question: ${question.message}`)
      }
    }

    return immediate(answers)
  }
}

module.exports = {
  createMockInquirerPackage,
}
