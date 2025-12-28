
type OrbitToggleProps = {
  enabled: boolean;
  toggle: ()=> void;
}

export function OrbitToggle({
  enabled,
  toggle,
}: OrbitToggleProps){
  return(
    <button
      className="orbit-toggle"
      onClick={toggle}
    >
      {enabled ? "lock camera" : "unlock camera"}
    </button>
  )
}