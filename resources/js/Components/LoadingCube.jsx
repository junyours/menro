import React from "react";

export default function LoadingCube() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px]">
      <div className="cube-loader">
        <div className="cube-top"></div>
        <div className="cube-wrapper">
          <span className="cube-span"></span>
          <span className="cube-span"></span>
          <span className="cube-span"></span>
          <span className="cube-span"></span>
        </div>
      </div>

      <p className="mt-6 text-lg font-bold tracking-wide glow-text">
        Fetching Details...
      </p>

      <style jsx>{`
        .cube-loader {
          position: relative;
          width: 90px;
          height: 90px;
          transform-style: preserve-3d;
          transform: rotateX(-25deg) rotateY(30deg);
          animation: cube-rotate 2.5s infinite ease-in-out;
        }

        .cube-top {
          position: absolute;
          width: 90px;
          height: 90px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          transform: rotateX(90deg) translateZ(45px);
          border-radius: 12px;
          filter: blur(1px);
        }

        .cube-wrapper .cube-span {
          position: absolute;
          width: 90px;
          height: 90px;
          border-radius: 12px;
          background: rgba(59, 130, 246, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(6px);
          box-shadow: 0 4px 20px rgba(37, 99, 235, 0.4);
        }

        .cube-wrapper .cube-span:nth-child(1) {
          transform: rotateY(0deg) translateZ(45px);
        }
        .cube-wrapper .cube-span:nth-child(2) {
          transform: rotateY(90deg) translateZ(45px);
        }
        .cube-wrapper .cube-span:nth-child(3) {
          transform: rotateY(180deg) translateZ(45px);
        }
        .cube-wrapper .cube-span:nth-child(4) {
          transform: rotateY(-90deg) translateZ(45px);
        }

        @keyframes cube-rotate {
          0% {
            transform: rotateX(-25deg) rotateY(0deg);
          }
          50% {
            transform: rotateX(-25deg) rotateY(180deg);
          }
          100% {
            transform: rotateX(-25deg) rotateY(360deg);
          }
        }

        /* ✨ Glowing Blue Text */
        .glow-text {
          color: #3b82f6;
          text-shadow: 0 0 5px #3b82f6, 0 0 10px #2563eb, 0 0 20px #1d4ed8;
          animation: glow-pulse 1.5s infinite alternate;
        }

        @keyframes glow-pulse {
          from {
            text-shadow: 0 0 5px #3b82f6, 0 0 10px #2563eb, 0 0 20px #1d4ed8;
          }
          to {
            text-shadow: 0 0 10px #60a5fa, 0 0 20px #3b82f6, 0 0 30px #2563eb;
          }
        }
      `}</style>
    </div>
  );
}
