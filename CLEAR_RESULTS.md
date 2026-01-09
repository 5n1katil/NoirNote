# Vaka Geçmişi Sıfırlama Talimatları

Tüm oyuncular için vaka geçmişini (results collection) temizlemek için aşağıdaki yöntemlerden birini kullanabilirsiniz:

## Yöntem 1: Firebase Console'dan Manuel Silme (En Kolay)

1. Firebase Console'a gidin: https://console.firebase.google.com/
2. Projenizi seçin
3. Sol menüden "Firestore Database" > "Data" sekmesine gidin
4. `results` collection'ını bulun
5. Collection'ın üzerine tıklayın
6. Tüm dokümanları seçin (Ctrl+A veya Cmd+A)
7. "Delete" butonuna tıklayın
8. Onaylayın

## Yöntem 2: Firebase CLI ile Silme

Eğer Firebase CLI yüklüyse:

```bash
# Firebase CLI ile login olun
firebase login

# Projenizi seçin
firebase use <project-id>

# Firestore'dan tüm results'ı silin (dikkatli kullanın!)
firebase firestore:delete --all-collections results --yes
```

## Yöntem 3: Node.js Script ile Silme

1. Firebase Admin SDK'yı yükleyin:
```bash
npm install firebase-admin --save-dev
```

2. Firebase Service Account Key'i indirin:
   - Firebase Console > Project Settings > Service Accounts
   - "Generate New Private Key" butonuna tıklayın
   - JSON dosyasını proje root'una `firebase-admin-key.json` olarak kaydedin
   - **NOT**: Bu dosyayı `.gitignore`'a ekleyin!

3. Aşağıdaki script'i `scripts/clear-all-results.js` olarak kaydedin:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('../firebase-admin-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function clearAllResults() {
  console.log('Starting to clear all case results...');
  
  const resultsRef = db.collection('results');
  const snapshot = await resultsRef.get();
  
  if (snapshot.empty) {
    console.log('No results found. Collection is already empty.');
    return;
  }
  
  console.log(`Found ${snapshot.size} result documents to delete.`);
  
  // Delete in batches (Firestore allows max 500 deletes per batch)
  const batchSize = 500;
  let deletedCount = 0;
  
  for (let i = 0; i < snapshot.docs.length; i += batchSize) {
    const batch = db.batch();
    const batchDocs = snapshot.docs.slice(i, i + batchSize);
    
    batchDocs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    deletedCount += batchDocs.length;
    console.log(`Deleted ${deletedCount}/${snapshot.size} documents...`);
  }
  
  console.log(`✓ Successfully deleted all ${deletedCount} case result documents.`);
}

clearAllResults()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
```

4. Script'i çalıştırın:
```bash
node scripts/clear-all-results.js
```

## Önemli Notlar

- ⚠️ **UYARI**: Bu işlem geri alınamaz! Tüm vaka geçmişi kalıcı olarak silinecektir.
- Bu işlem sadece `results` collection'ını temizler, diğer veriler (stats, leaderboard, activeCase) etkilenmez.
- İşlem sonrası yeni oynanan vakalar otomatik olarak kaydedilmeye devam edecektir.

