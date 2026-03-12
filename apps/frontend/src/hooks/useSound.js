import { useRef } from "react";

export default function useSound(src) {
  const sound = useRef(new Audio(src));

  const play = () => {
    sound.current.currentTime = 0;
    sound.current.play();
  };

  return play;
}