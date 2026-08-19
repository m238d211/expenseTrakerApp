module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '^lucide-react-native$': '<rootDir>/__mocks__/lucide-react-native.tsx',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-keychain|react-native-screens|react-native-svg|lucide-react-native|@tanstack))',
  ],
};
