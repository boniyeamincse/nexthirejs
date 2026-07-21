# @nexthire/constants

Shared constants for NextHire monorepo.

## Purpose

Provides immutable foundational constants for the NextHire platform including:
- Country information
- Currency information
- Language information
- HTTP-related constants

## Public Exports

All constants are exported from `src/index.ts`:

- **Countries** (`./countries`):
  - `SUPPORTED_COUNTRIES` - Array of supported country codes
  - `CountryInfo` - Country metadata interface
  - `COUNTRY_MAP` - Map of country code to country info

- **Currencies** (`./currencies`):
  - `SUPPORTED_CURRENCIES` - Array of supported currency codes
  - `CurrencyInfo` - Currency metadata interface
  - `CURRENCY_MAP` - Map of currency code to currency info

- **Languages** (`./languages`):
  - `SUPPORTED_LANGUAGES` - Array of supported language codes
  - `LanguageInfo` - Language metadata interface
  - `LANGUAGE_MAP` - Map of language code to language info

- **HTTP** (`./http`):
  - `DEFAULT_PAGE_SIZE`
  - `MAX_PAGE_SIZE`
  - `REQUEST_ID_HEADER`
  - `IDEMPOTENCY_KEY_HEADER`

## Example Import

```typescript
import { SUPPORTED_COUNTRIES } from '@nexthire/constants';
import { DEFAULT_PAGE_SIZE } from '@nexthire/constants/http';
import type { CountryInfo } from '@nexthire/constants/countries';
```

## Build Command

```bash
pnpm --filter @nexthire/constants build
```

## Type-check Command

```bash
pnpm --filter @nexthire/constants typecheck
```

## Test Command

```bash
pnpm --filter @nexthire/constants test
```

## Scope Limitations

This package does NOT include:

- Business enums
- Feature-specific configurations
- Environment variables
- User-generated content

All constants are immutable and use `as const` where appropriate.

## Supported Markets

### Countries

- Bangladesh (BD) - +880, BDT, Asia/Dhaka
- Pakistan (PK) - +92, PKR, Asia/Karachi
- India (IN) - +91, INR, Asia/Kolkata

### Languages

- English (en)
- Bengali (bn)
- Urdu (ur) - RTL direction
- Hindi (hi)

### Currencies

- BDT (Bangladeshi Taka)
- PKR (Pakistani Rupee)
- INR (Indian Rupee)
- USD (US Dollar)