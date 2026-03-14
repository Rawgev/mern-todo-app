function Header(props) {
  return (
    <header style={{ marginBottom: "20px" }}>
      <h1>{props.title} 👋</h1>
      <p>{props.subtitle}</p>
    </header>
  );
}

export default Header;
