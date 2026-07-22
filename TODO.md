# TODO: NH-P1-T008 — Candidate Education Records (Frontend)

## Steps

### 1. Create EducationRecordCard.tsx

- [ ] Extract card display from EducationList into a reusable component
- [ ] Props: record, onEdit, onDelete, onMoveUp, onMoveDown, isFirst, isLast

### 2. Create EducationFormModal.tsx

- [ ] Create a dialog/modal component wrapping EducationForm
- [ ] Use native `<dialog>` element for accessibility
- [ ] Props: isOpen, initialData, onSave, onCancel

### 3. Update EducationList.tsx to use EducationRecordCard

- [ ] Import and use EducationRecordCard component

### 4. Create **tests**/education.test.tsx

- [ ] Test EducationList (empty/list/reorder)
- [ ] Test EducationForm (currently-studying toggle, validation)
- [ ] Test EducationFormModal (open/close behavior)
- [ ] Test EducationPage (loading/empty/loaded/CRUD states)
- [ ] Mock api-client module

### 5. Verify

- [ ] Run `pnpm --filter @nexthire/web test`
- [ ] Run `pnpm --filter @nexthire/web build`
