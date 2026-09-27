const SPINE_DEMO = [
  { label: "Novel", height: 62 },
  { label: "Manga", height: 78 },
  { label: "Manhua", height: 55 },
  { label: "Manhwa", height: 70 },
  { label: "Anime", height: 85 },
  { label: "Donghua", height: 60 },
];

export default function AuthLayout({ children }) {
  return (
    <div className="auth-screen">
      <div className="auth-hero">
        <div className="spines">
          {SPINE_DEMO.map((s, i) => (
            <div
              key={s.label}
              className="spine"
              style={{ height: `${s.height}%`, "--spine-index": i }}
            >
              <span>{s.label}</span>
            </div>
          ))}
        </div>
        <div className="auth-hero-copy">
          <p className="auth-hero-tagline">Every story, one shelf</p>
          <h2>
            Novels, manga, manhua, manhwa,
            <br />
            anime, donghua — all logged
            <br />
            in one place.
          </h2>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-panel-inner">{children}</div>
      </div>
    </div>
  );
}
