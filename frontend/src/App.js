import React, { useEffect, useState, useRef } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import Papa from 'papaparse';
import './App.css';

const API_URL = 'http://localhost:4000';

function randomSeed() {
  return Math.floor(Math.random() * 10000000).toString();
}

function BookTable({ books, onExpand, expandedIndex }) {
  return (
    <table className="book-table">
      <thead>
        <tr>
          <th></th>
          <th>#</th>
          <th>ISBN</th>
          <th>Title</th>
          <th>Authors</th>
          <th>Publisher</th>
          <th>Likes</th>
          <th>Reviews</th>
        </tr>
      </thead>
      <tbody>
        {books.map((book, idx) => (
          <React.Fragment key={book.index}>
            <tr className={`book-row${expandedIndex === idx ? ' selected' : ''}`} onClick={() => onExpand(idx)}>
              <td style={{width: 32, textAlign: 'center'}}>
                {expandedIndex === idx ? <span style={{fontSize: '1.2em', color: '#1976d2'}}>&#9650;</span> : <span style={{fontSize: '1.2em', color: '#888'}}>&#9660;</span>}
              </td>
              <td>{book.index}</td>
              <td>{book.isbn}</td>
              <td>{book.title}</td>
              <td>{book.authors.join(', ')}</td>
              <td>{book.publisher}</td>
              <td><span className="likes-badge">{book.likes}</span></td>
              <td>{book.reviews.length}</td>
            </tr>
            {expandedIndex === idx && (
              <tr className="book-details">
                <td colSpan={8}>
                  <BookDetails book={book} />
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
}

function BookDetails({ book }) {
  const [coverUrl, setCoverUrl] = useState('');
  useEffect(() => {
    setCoverUrl(`${API_URL}/cover?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.authors[0])}`);
  }, [book]);
  return (
    <div className="details-container">
      <img src={coverUrl} alt="cover" width={80} height={120} style={{ marginRight: 16 }} />
      <div style={{flex: 1}}>
        <div style={{fontSize: '1.25em', fontWeight: 600, marginBottom: 2}}>{book.title} <span style={{color:'#888', fontWeight:400, fontSize:'0.95em'}}>Paperback</span></div>
        <div style={{marginBottom: 2}}><span style={{fontStyle:'italic', fontWeight:500}}>by {book.authors[0]}</span></div>
        <div style={{color:'#888', fontSize:'0.98em', marginBottom: 8}}>{book.publisher}</div>
        <div className="likes-badge" style={{marginBottom: 8}}>{book.likes} Likes</div>
        <div style={{fontWeight:600, marginBottom: 4}}>Review</div>
        <ul style={{margin:0, paddingLeft:18}}>
          {book.reviews.length === 0 && <li style={{color:'#888'}}>No reviews</li>}
          {book.reviews.map((r, i) => (
            <li key={i} style={{marginBottom: 4}}>
              <span style={{fontWeight:500}}>{r.text}</span>
              <br/>
              <span style={{color:'#1976d2', fontWeight:500}}>&mdash; {r.author}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Controls({ locales, locale, setLocale, seed, setSeed, avgLikes, setAvgLikes, avgReviews, setAvgReviews, onRandomSeed }) {
  return (
    <div className="controls">
      <label>
        Language
        <select value={locale} onChange={e => setLocale(e.target.value)}>
          {locales.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </label>
      <label>
        Seed
        <input value={seed} onChange={e => setSeed(e.target.value.replace(/\D/g, ''))} style={{ width: 90 }} />
        <button onClick={onRandomSeed} title="Randomize seed">&#128256;</button>
      </label>
      <label>
        Likes
        <input type="range" min={0} max={10} step={0.1} value={avgLikes} onChange={e => setAvgLikes(e.target.value)} />
        <span>{avgLikes}</span>
      </label>
      <label>
        Review
        <input type="number" min={0} max={10} step={0.1} value={avgReviews} onChange={e => setAvgReviews(e.target.value)} style={{ width: 60 }} />
      </label>
    </div>
  );
}

function App() {
  const [locales, setLocales] = useState([]);
  const [locale, setLocale] = useState('en_US');
  const [seed, setSeed] = useState('42');
  const [avgLikes, setAvgLikes] = useState('3.7');
  const [avgReviews, setAvgReviews] = useState('4.7');
  const [books, setBooks] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const pageSize = 20;
  const loadingRef = useRef(false);

  useEffect(() => {
    fetch(`${API_URL}/locales`).then(r => r.json()).then(setLocales);
  }, []);

  // Reset books when any control changes
  useEffect(() => {
    setBooks([]);
    setPage(1);
    setHasMore(true);
    setExpandedIndex(null);
    fetchBooks(1, true);
    // eslint-disable-next-line
  }, [locale, seed, avgLikes, avgReviews]);

  function fetchBooks(pageToFetch, reset = false) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    fetch(`${API_URL}/books?locale=${locale}&seed=${seed}&avgLikes=${avgLikes}&avgReviews=${avgReviews}&page=${pageToFetch}&pageSize=${pageToFetch === 1 ? pageSize : 10}`)
      .then(r => r.json())
      .then(data => {
        setBooks(prev => reset ? data.books : [...prev, ...data.books]);
        setHasMore(data.books.length > 0);
        setPage(pageToFetch + 1);
        loadingRef.current = false;
      });
  }

  function handleExpand(idx) {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  }

  function handleExportCSV() {
    const csv = Papa.unparse(books.map(b => ({
      Index: b.index,
      ISBN: b.isbn,
      Title: b.title,
      Authors: b.authors.join(', '),
      Publisher: b.publisher,
      Likes: b.likes,
      Reviews: b.reviews.length
    })));
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `books_page_${seed}_${locale}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="App">
      <h1>Bookstore Test Data Generator</h1>
      <Controls
        locales={locales}
        locale={locale}
        setLocale={setLocale}
        seed={seed}
        setSeed={setSeed}
        avgLikes={avgLikes}
        setAvgLikes={setAvgLikes}
        avgReviews={avgReviews}
        setAvgReviews={setAvgReviews}
        onRandomSeed={() => setSeed(randomSeed())}
      />
      <button className="export-btn" onClick={handleExportCSV}>Export to CSV</button>
      <InfiniteScroll
        dataLength={books.length}
        next={() => fetchBooks(page)}
        hasMore={hasMore}
        loader={<h4>Loading...</h4>}
        scrollThreshold={0.95}
      >
        <BookTable books={books} onExpand={handleExpand} expandedIndex={expandedIndex} />
      </InfiniteScroll>
    </div>
  );
}

export default App;
