const express = require('express');
const cors = require('cors');
const { fakerEN, fakerDE, fakerJA } = require('@faker-js/faker');
const seedrandom = require('seedrandom');
const { createCanvas } = require('canvas');

const app = express();
const PORT = 4000;

app.use(cors());

const SUPPORTED_LOCALES = [
  { code: 'en', label: 'English (US)' },
  { code: 'de', label: 'German (Germany)' },
  { code: 'ja', label: 'Japanese (Japan)' },
];

function getLocale(code) {
  return SUPPORTED_LOCALES.find(l => l.code === code) ? code : 'en';
}

function combineSeed(userSeed, page) {
  return `${userSeed}-${page}`;
}

function getRandomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function generateBook({ rng, locale, index }) {
  let faker;
  if (locale === 'de') {
    faker = fakerDE;
  } else if (locale === 'ja') {
    faker = fakerJA;
  } else {
    faker = fakerEN;
  }

  const isbn = faker.number.int({ min: 1000000000000, max: 9999999999999 }).toString();

  let title;
  switch (locale) {
    case 'de':
      title = `${faker.word.adjective()} ${faker.word.noun()}`;
      break;
    case 'ja':
      title = faker.lorem.words(getRandomInt(rng, 2, 5));
      break;
    case 'en':
    default:
      title = faker.company.catchPhrase();
      break;
  }
  title = title.charAt(0).toUpperCase() + title.slice(1);

  const authorCount = getRandomInt(rng, 1, 3);
  const authors = Array.from({ length: authorCount }, () => faker.person.fullName());
  const publisher = faker.company.name();
  return { isbn, title, authors, publisher };
}

function generateReviews({ rng, locale, avgReviews }) {
  let faker;
  if (locale === 'de') {
    faker = fakerDE;
  } else if (locale === 'ja') {
    faker = fakerJA;
  } else {
    faker = fakerEN;
  }

  const reviews = [];
  const intPart = Math.floor(avgReviews);
  const fracPart = avgReviews - intPart;
  let count = intPart;
  if (rng() < fracPart) count += 1;
  for (let i = 0; i < count; i++) {
    let text;
    switch (locale) {
      case 'de':
        const sentenceCount = getRandomInt(rng, 2, 3);
        const sentences = [];
        for (let j = 0; j < sentenceCount; j++) {
          const sentence = `der ${faker.word.adjective()} ${faker.word.noun()} ${faker.word.verb()} die ${faker.word.adjective()} ${faker.word.noun()}.`;
          sentences.push(sentence.charAt(0).toUpperCase() + sentence.slice(1));
        }
        text = sentences.join(' ');
        break;
      case 'ja':
        text = faker.lorem.sentences(getRandomInt(rng, 2, 4));
        break;
      case 'en':
      default:
        const phraseCount = getRandomInt(rng, 2, 4);
        text = Array.from({ length: phraseCount }, () => faker.hacker.phrase()).join(' ');
        text = text.charAt(0).toUpperCase() + text.slice(1) + '.';
        break;
    }

    reviews.push({
      author: faker.person.fullName(),
      text,
    });
  }
  return reviews;
}

function generateLikes({ rng, avgLikes }) {
  const intPart = Math.floor(avgLikes);
  const fracPart = avgLikes - intPart;
  let count = intPart;
  if (rng() < fracPart) count += 1;
  return count;
}

app.get('/locales', (req, res) => {
  res.json(SUPPORTED_LOCALES);
});

app.get('/books', (req, res) => {
  const {
    locale = 'en',
    seed = '42',
    avgLikes = '3.7',
    avgReviews = '4.7',
    page = '1',
    pageSize = '20',
  } = req.query;
  const pageNum = parseInt(page, 10);
  const size = parseInt(pageSize, 10);
  const avgLikesNum = parseFloat(avgLikes);
  const avgReviewsNum = parseFloat(avgReviews);
  const books = [];
  const usedLocale = getLocale(locale);
  for (let i = 0; i < size; i++) {
    const index = (pageNum - 1) * size + i + 1;
    const bookRng = seedrandom(combineSeed(seed, `${pageNum}-${i}`));
    const book = generateBook({ rng: bookRng, locale: usedLocale, index });
    book.index = index;
    book.likes = generateLikes({ rng: bookRng, avgLikes: avgLikesNum });
    book.reviews = generateReviews({ rng: bookRng, locale: usedLocale, avgReviews: avgReviewsNum });
    books.push(book);
  }
  res.json({ books });
});

app.get('/cover', (req, res) => {
  const { title = '', author = '' } = req.query;
  const width = 200;
  const height = 300;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const coverColors = [
    '#e3f2fd', // Light Blue
    '#e8eaf6', // Light Indigo
    '#e0f2f1', // Light Teal
    '#fce4ec', // Light Pink
    '#f1f8e9', // Light Green
  ];

  const rng = seedrandom(title);
  const colorIndex = Math.floor(rng() * coverColors.length);
  ctx.fillStyle = coverColors[colorIndex];
  ctx.fillRect(0, 0, width, height);

  ctx.font = 'bold 18px Arial';
  ctx.fillStyle = '#222';
  ctx.textAlign = 'center';
  const words = title.split(' ');
  if (words.length > 3) {
    const line1 = words.slice(0, 3).join(' ');
    const line2 = words.slice(3).join(' ');
    ctx.fillText(line1, width / 2, 70, width - 20);
    ctx.fillText(line2, width / 2, 95, width - 20);
  } else {
    ctx.fillText(title, width / 2, 80, width - 20);
  }

  ctx.font = 'italic 14px Arial';
  ctx.fillText(author, width / 2, 120, width - 20);

  ctx.strokeStyle = '#cfcfcf';
  ctx.strokeRect(0, 0, width, height);

  res.set('Content-Type', 'image/png');
  canvas.pngStream().pipe(res);
});

const path = require('path');

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Catch all handler: send back React's index.html file for any non-API requests
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith('/books') && !req.path.startsWith('/cover') && !req.path.startsWith('/locales')) {
    res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`Bookstore test data server running on port ${PORT}`);
});