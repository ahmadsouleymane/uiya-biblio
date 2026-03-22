import { useNavigate } from "react-router-dom";

export default function Book({ id, cover }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/book/${id}`)}
      className="bg-primary h-56 md:h-70 bg-center bg-cover rounded-xl cursor-pointer"
      style={{ backgroundImage: `url(${cover})` }}
    />
  );
}
