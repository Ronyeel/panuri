import { useNavigate } from 'react-router-dom';
import './teoryangPampanitikan.css';

export default function TeoryangPampanitikan() {
  const navigate = useNavigate();

  return (
    <main className="teorya-page">
      <div className="teorya-container">

        {/* Top Header */}
        <header className="teorya-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Bumalik
          </button>
          <h1 className="main-title">THIS IS A PLACEHOLDER</h1>
        </header>
      </div>
    </main>
  );
}