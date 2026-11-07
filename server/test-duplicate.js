import { haversine, textSimilarity, findDuplicates } from './src/services/duplicate.service.js';

console.log('--- Haversine tests ---');
console.log('Same point (expect 0):', haversine(24.86, 67.0, 24.86, 67.0).toFixed(2));
console.log('~100m apart (expect ~100):', haversine(24.86, 67.0, 24.8609, 67.0).toFixed(2));
console.log('~1km apart (expect ~1000):', haversine(24.86, 67.0, 24.869, 67.0).toFixed(2));

console.log('\n--- Similarity tests ---');
console.log('Identical (expect 1):', textSimilarity('broken streetlight', 'broken streetlight'));
console.log('Similar (expect ~0.6):', textSimilarity('broken streetlight near park', 'streetlight broken at park'));
console.log('Different (expect 0):', textSimilarity('broken streetlight', 'garbage overflow'));
console.log('Empty (expect 1):', textSimilarity('', ''));

console.log('\n--- findDuplicates against real DB ---');
const dupes = await findDuplicates({
  title: 'Streetlight not working',
  description: 'Broken streetlight at the main crossing',
  latitude: 24.8607,
  longitude: 67.0011,
  category_id: 4,
});
console.log(JSON.stringify(dupes, null, 2));
