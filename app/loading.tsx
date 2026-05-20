export default function Loading() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "60vh",
    }}>
      <div style={{ textAlign: "center" }}>
        <div
          className="skeleton"
          style={{
            width: 48, height: 48, borderRadius: "50%",
            margin: "0 auto 16px",
          }}
        />
        <div style={{
          width: 120, height: 14, borderRadius: 99,
          margin: "0 auto",
        }} className="skeleton" />
      </div>
    </div>
  );
}
