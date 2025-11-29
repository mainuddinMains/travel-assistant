export default function Card({ title, value }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}
