export const patterns = [
  {
    id: 1,
    regex: /^[a-zA-Z0-9]+$/,
    key: 'patterns.standardAlphanumeric',
    description: 'patterns.standardAlphanumeric',
    name: 'standardAlphanumeric'
  },
  {
    id: 2,
    regex: /^[A-Za-z\u4e00-\u9fa5.·‧．]+$/,
    key: 'patterns.nameWithPinyin',
    description: 'patterns.nameWithPinyin',
    name: 'nameWithPinyin'
  },
  {
    id: 3,
    regex:
      /^[a-zA-Z0-9]{1}([._a-zA-Z0-9-]+)(\.[_a-zA-Z0-9-]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+){1,3}$/,
    key: 'patterns.standardEmail',
    description: 'patterns.standardEmail',
    name: 'standardEmail'
  },
  {
    id: 4,
    regex: /^[a-zA-Z0-9]+$/,
    key: 'patterns.standardAlphanumeric',
    description: 'patterns.standardAlphanumeric',
    name: 'standardAlphanumeric'
  },
  {
    id: 5,
    regex: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d_]+$/,
    key: 'patterns.passwordType1',
    description: 'patterns.passwordType1',
    name: 'passwordType1'
  },
  {
    id: 6,
    regex: /^[0-9]+$/,
    key: 'patterns.numberOnly',
    description: 'patterns.numberOnly',
    name: 'numberOnly'
  },
  {
    id: 7,
    regex: /^(?=.*[A-Z])[A-Za-z\d]+$/,
    key: 'patterns.passwordType2',
    description: 'patterns.passwordType2',
    name: 'passwordType2'
  },
  {
    id: 8,
    regex: /^[a-zA-Z ]*[a-zA-Z][a-zA-Z ]*$/,
    key: 'patterns.alphabetAndSpacingOnly',
    description: 'patterns.alphabetAndSpacingOnly',
    name: 'alphabetAndSpacingOnly'
  },
  {
    id: 9,
    regex: /^[^-\s]+$/,
    key: 'patterns.anyWithoutSpace',
    description: 'patterns.anyWithoutSpace',
    name: 'anyWithoutSpace'
  },
  {
    id: 10,
    regex: /^(?=[\u4e00-\u9fa5])[\u4e00-\u9fa5.·‧．,。，_＿－-]*$/,
    key: 'patterns.chineseCharAndPunctuation',
    description: 'patterns.chineseCharAndPunctuation',
    name: 'chineseCharAndPunctuation'
  },
  {
    id: 11,
    regex: /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/,
    key: 'patterns.dateYyyyMmDd',
    description: 'patterns.dateYyyyMmDd',
    name: 'dateYyyyMmDd'
  },
  {
    id: 12,
    regex: /^([a-zA-Z]+\s)+[a-zA-Z]+$/,
    key: 'patterns.standardFullNamePattern',
    description: 'patterns.standardFullNamePattern',
    name: 'standardFullNamePattern'
  },
  {
    id: 13,
    regex: /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])-\d{4}$/,
    key: 'patterns.dateMmDdYyyy',
    description: 'patterns.dateMmDdYyyy',
    name: 'dateMmDdYyyy'
  },
  {
    id: 14,
    regex: /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]+$/,
    key: 'patterns.alphabetAndNumberOnly',
    description: 'patterns.alphabetAndNumberOnly',
    name: 'alphabetAndNumberOnly'
  },
  {
    id: 15,
    regex: /^[\uAC00-\uD7AF]+$/,
    key: 'patterns.koreanOnly',
    description: 'patterns.koreanOnly',
    name: 'koreanOnly'
  },
  {
    id: 16,
    regex: /^[\u0E00-\u0E7F\s]+$/,
    key: 'patterns.thaiAndSpacingOnly',
    description: 'patterns.thaiAndSpacingOnly',
    name: 'thaiAndSpacingOnly'
  },
  {
    id: 17,
    regex: /^[a-zA-Z\u0E00-\u0E7F\s]+$/,
    key: 'patterns.thaiOrAlphabetAndSpacing',
    description: 'patterns.thaiOrAlphabetAndSpacing',
    name: 'thaiOrAlphabetAndSpacing'
  },
  {
    id: 18,
    regex: /^(?=.*[A-Z])[A-Z ]+$/,
    key: 'patterns.uppercaseLettersAndSpacesOnly',
    description: 'patterns.uppercaseLettersAndSpacesOnly',
    name: 'uppercaseLettersAndSpacesOnly'
  },
  {
    id: 19,
    regex: /^[A-Z]+$/,
    key: 'patterns.onlyUppercaseEnglishLetters',
    description: 'patterns.onlyUppercaseEnglishLetters',
    name: 'onlyUppercaseEnglishLetters'
  },
  {
    id: 20,
    regex: /^[\u0021-\u007e]+$/,
    key: 'patterns.alphanumericAndSymbol',
    description: 'patterns.alphanumericAndSymbol',
    name: 'alphanumericAndSymbol'
  },
  {
    id: 21,
    regex: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).+$/,
    key: 'patterns.complexPassword',
    description: 'patterns.complexPassword',
    name: 'complexPassword'
  },
  {
    id: 22,
    regex:
      /^[A-Za-zÀ-ÖØ-öø-ÿĀ-žȘșȚțẞßİıÇçĞğŞşÜüÖöÑñ]+(?:\s+[A-Za-zÀ-ÖØ-öø-ÿĀ-žȘșȚțẞßİıÇçĞğŞşÜüÖöÑñ]+)+$/,
    key: 'patterns.latinExtendedWithSpace',
    description: 'patterns.latinExtendedWithSpace',
    name: 'latinExtendedWithSpace'
  },
  {
    id: 23,
    regex: /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3005]+$/,
    key: 'patterns.japaneseCharacters',
    description: 'patterns.japaneseCharacters',
    name: 'japaneseCharacters'
  },
  {
    id: 24,
    regex: /^[a-zA-Z\uAC00-\uD7A3]{2,30}$/,
    key: 'patterns.englishAndKorean',
    description: 'patterns.englishAndKorean',
    name: 'englishAndKorean'
  }
]
