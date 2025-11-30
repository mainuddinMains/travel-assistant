useEffect(() => {
  fetch("http://127.0.0.1:8000/plan?destination=Japan")
    .then(res => res.json())
    .then(data => console.log("AI Trip Plan:", data));
}, []);
