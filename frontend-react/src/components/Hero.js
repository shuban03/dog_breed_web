export default function Hero() {
  return (
    <section style={{display:"flex", alignItems:"center"}}>
      <div className="section-divider"></div>
      <div style={{flex:1}}>
        <h1>🐶 Dog Breed Predictor</h1>
        <p>Upload a dog image and predict its breed using AI.</p>
        <span style={{
          background:"#2e7d32",
          color:"white",
          padding:"6px 14px",
          borderRadius:"20px"
        }}>
          January 29, 2026
        </span>
      </div>

      <img
        src="https://images.unsplash.com/photo-1558788353-f76d92427f16"
        alt="Dog"
        style={{width:"45%", borderRadius:"20px"}}
      />
    </section>
  );
}
