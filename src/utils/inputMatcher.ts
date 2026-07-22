/**
 * Phase 2 簡易入力判定。
 * Phase 3 で romajiMatcher に置き換え可能なインターフェース。
 */
export interface InputMatcher {
  expectedChar(inputText: string, typedLength: number): string | null
  isComplete(inputText: string, typedLength: number): boolean
  matches(inputText: string, typedLength: number, char: string): boolean
}

export const simpleInputMatcher: InputMatcher = {
  expectedChar(inputText, typedLength) {
    if (typedLength < 0 || typedLength >= inputText.length) {
      return null
    }
    return inputText[typedLength]!.toLowerCase()
  },
  isComplete(inputText, typedLength) {
    return typedLength >= inputText.length
  },
  matches(inputText, typedLength, char) {
    const expected = this.expectedChar(inputText, typedLength)
    return expected !== null && expected === char.toLowerCase()
  },
}
