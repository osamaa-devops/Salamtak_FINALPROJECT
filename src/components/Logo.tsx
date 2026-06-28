import svgPaths from "../imports/svg-l2869fnkg6";

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = "", size = 48 }: LogoProps) {
  return (
    <div className={className} style={{ width: size, height: size }}>
      <svg 
        className="block size-full" 
        fill="none" 
        preserveAspectRatio="xMidYMid meet" 
        viewBox="0 0 512 448"
      >
        <g>
          <path 
            d="M22 285H143.5" 
            stroke="currentColor" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="44" 
          />
          <path 
            d={svgPaths.p10435100} 
            fill="currentColor" 
          />
          <path 
            d={svgPaths.p322fa00} 
            stroke="white" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="30" 
          />
          <path 
            d={svgPaths.pf412400} 
            stroke="currentColor" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="30" 
            opacity="0.6"
          />
          <path 
            d="M358.5 107L310 272" 
            stroke="white" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="30" 
          />
        </g>
      </svg>
    </div>
  );
}
