export function RatingWidget({
  curRating,
  onSetRating,
}: {
  curRating: number;
  onSetRating: (rating: number) => void;
}) {
  return (
    <div className="rating">
      {[1, 2, 3, 4, 5].map((rating) => {
        return (
          <span
            key={rating}
            onClick={() => {
              onSetRating(rating);
            }}
          >
            {rating <= curRating ? "★" : "☆"}
          </span>
        );
      })}
    </div>
  );
}
