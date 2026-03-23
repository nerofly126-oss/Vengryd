const LeafSVG = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Main leaf */}
    <path
      d="M10 110 C10 110, 15 60, 50 30 C70 15, 95 10, 110 10 C110 10, 100 40, 75 65 C55 82, 25 95, 10 110Z"
      fill="hsl(145 40% 35% / 0.15)"
      stroke="hsl(145 40% 35% / 0.3)"
      strokeWidth="1"
    />
    {/* Leaf vein */}
    <path
      d="M10 110 C40 75, 70 45, 110 10"
      stroke="hsl(145 40% 35% / 0.2)"
      strokeWidth="1"
      fill="none"
    />
    {/* Side veins */}
    <path d="M35 85 C50 70, 60 65, 75 55" stroke="hsl(145 40% 35% / 0.12)" strokeWidth="0.8" fill="none" />
    <path d="M25 70 C40 58, 55 48, 70 40" stroke="hsl(145 40% 35% / 0.12)" strokeWidth="0.8" fill="none" />
    <path d="M45 95 C60 80, 75 68, 90 55" stroke="hsl(145 40% 35% / 0.12)" strokeWidth="0.8" fill="none" />
    {/* Small secondary leaf */}
    <path
      d="M60 110 C60 110, 62 85, 78 70 C88 62, 100 58, 110 55 C110 55, 105 72, 90 85 C80 93, 68 100, 60 110Z"
      fill="hsl(145 40% 35% / 0.1)"
      stroke="hsl(145 40% 35% / 0.2)"
      strokeWidth="0.8"
    />
  </svg>
);

const LeafCorners = () => {
  return (
    <>
      {/* Top-left */}
      <div className="fixed top-0 left-0 w-24 h-24 md:w-36 md:h-36 z-40 pointer-events-none animate-sway">
        <LeafSVG className="w-full h-full rotate-0" />
      </div>
      {/* Top-right */}
      <div className="fixed top-0 right-0 w-24 h-24 md:w-36 md:h-36 z-40 pointer-events-none animate-sway" style={{ animationDelay: '1.5s' }}>
        <LeafSVG className="w-full h-full -scale-x-100" />
      </div>
      {/* Bottom-left */}
      <div className="fixed bottom-0 left-0 w-24 h-24 md:w-36 md:h-36 z-40 pointer-events-none animate-sway" style={{ animationDelay: '3s' }}>
        <LeafSVG className="w-full h-full -scale-y-100" />
      </div>
      {/* Bottom-right */}
      <div className="fixed bottom-0 right-0 w-24 h-24 md:w-36 md:h-36 z-40 pointer-events-none animate-sway" style={{ animationDelay: '4.5s' }}>
        <LeafSVG className="w-full h-full -scale-x-100 -scale-y-100" />
      </div>
    </>
  );
};

export default LeafCorners;
