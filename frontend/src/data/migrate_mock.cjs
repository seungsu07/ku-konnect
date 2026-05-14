const fs = require('fs');
const path = require('path');

const filePath = 'c:/Users/haseu/Desktop/파이썬/NEXT/frontend/src/data/mockData.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix MockPeriod type
content = content.replace(/export type MockPeriod = .*?;/g, "export type MockPeriod = Period & { id: string, type: 'period', day: Day };");

// 2. Remove 'day' from Period model (internal to mock data we keep it as MockPeriod for now but we must satisfy Period which doesn't have it)
// We'll just cast MOCK_PERIODS as any where needed or fix them.

// 3. Fix MOCK_PROFESSORS (simplified)
content = content.replace(/login: { id: '(.*?)', password: '' }/g, "login_id: '$1', login_hash: '', login_salt: ''");

// 4. Fix MOCK_CLASSES
// periods: [MOCK_PERIODS[0], MOCK_PERIODS[1]] -> periods: [{ day: 'mon', periods: [MOCK_PERIODS[0]] }, { day: 'wed', periods: [MOCK_PERIODS[1]] }]
content = content.replace(/periods: \[(MOCK_PERIODS\[\d+\])(?:, (MOCK_PERIODS\[\d+\]))?(?:, (MOCK_PERIODS\[\d+\]))?\]/g, (match, p1, p2, p3) => {
  let res = 'periods: [{ day: "mon", periods: [' + p1 + '] }';
  if (p2) res += ', { day: "wed", periods: [' + p2 + '] }';
  if (p3) res += ', { day: "fri", periods: [' + p3 + '] }';
  res += ']';
  return res;
});

// Add 'lecture' to MOCK_CLASSES
content = content.replace(/{ id: asId\('cls-(\d+)'\), type: 'lecture_class'/g, (match, id) => {
  return `{ id: asId('cls-${id}'), type: 'lecture_class', lecture: asId('lect-1')`;
});

// 5. Fix MOCK_LECTURES (remove classes)
content = content.replace(/classes: \[asId\('cls-.*?'\),?.*?\]/g, '');
content = content.replace(/classes: \[MOCK_CLASSES\[\d+\]\.id,.*?\]/g, '');

// 6. Fix SAVED_TIMETABLES
content = content.replace(/days: {[\s\S]*?}/, (match) => {
    // Convert old object style to array style
    return "days: [\n      { day: 'mon', periods: [MOCK_PERIODS[0]] },\n      { day: 'wed', periods: [MOCK_PERIODS[1]] }\n    ]";
});

fs.writeFileSync(filePath, content);
console.log('Successfully updated mockData.ts');
