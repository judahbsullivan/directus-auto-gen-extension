# Changelog

All notable changes to this project will be documented in this file.

## [3.3.0] - 2026-02-08

### 🎨 UI Improvements
- **Edit Mode Display**: Replaced misleading hyperlink with a standard read-only `<v-input>` component for better UX (Issue #6)
- **Real-time Updates**: Field value updates dynamically as dependent fields change

### ✨ New Features
- **Bitwise Operations** (Issue #7): Added comprehensive bitwise operator support:
  - `BIT_AND(a, b)` - Bitwise AND
  - `BIT_OR(a, b)` - Bitwise OR
  - `BIT_XOR(a, b)` - Bitwise XOR
  - `BIT_NOT(a)` - Bitwise NOT
  - `BIT_LSHIFT(a, b)` - Left shift
  - `BIT_RSHIFT(a, b)` - Sign-propagating right shift
  - `BIT_URSHIFT(a, b)` - Zero-fill right shift

### 🔒 Technical
- Bitwise inputs are cast to 32-bit signed integers for consistent behavior
- Vue 3 `:model-value` binding for Directus 10+ compatibility

## [3.2.0] - 2026-02-08

### 🔥 Major Features
- **Server-Side Hooks**: Calculations now run on the server (`items.create`, `items.update`). This supports API, SDK, and Flow interactions.
- **Isomorphic Architecture**: Shared evaluation logic between Frontend (Vue) and Backend (Node.js) ensures consistency.
- **Smart Context Merging**: Partial updates via API now correctly fetch required dependencies (e.g., updating `quantity` will fetch `price` to recalculate `total`).
- **Bundle Support**: Refactored to Directus Bundle format (`app` + `api` entry points).

### Added
- **Directus 11.15.0+ compatibility**
- **Modern TypeScript support** - Updated to TypeScript 5.4+ with improved type safety
- **Enhanced Jest testing** - Added proper test configuration with mocks for Directus SDK
- **Node.js 18+ requirement** - Updated minimum Node.js version for better performance

### Changed
- **Updated dependencies** - All packages updated to latest secure versions
- **Removed deprecated code** - Eliminated deprecated CMS prefix API calls
- **Modern Vue 3 patterns** - Updated to use latest Vue 3 composition API patterns
- **Improved build system** - Enhanced TypeScript and build configuration

### Fixed
- **Security vulnerabilities** - Resolved all npm audit issues (14 vulnerabilities → 0)
- **Test failures** - Fixed `toSlug` function to return empty string instead of null
- **TypeScript compilation** - Removed `@ts-nocheck` and fixed type issues
- **Jest configuration** - Proper ES module support for Directus SDK

### Removed
- **Deprecated API functions** - Removed `fetchPrefixFromCMS` and `savePrefixToCMS`
- **Legacy TypeScript settings** - Simplified and modernized TypeScript configuration

## [3.1.0] - Previous Version

### Features
- Initial release with basic auto-generation functionality
- Support for various mathematical and string operations
- Template-based field computation system

### Known Issues
- Security vulnerabilities in dependencies
- TypeScript compilation warnings
- Test failures in `toSlug` function