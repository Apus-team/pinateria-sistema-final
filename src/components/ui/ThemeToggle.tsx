import useTheme from '../../hooks/useTheme.tsx'
import './ThemeToggle.css'

export default function ThemeToggle() {
  const { isDark, toggle } = useTheme()

  return (
    <label className="theme-switch" aria-label="Cambiar modo claro/oscuro">
      <input
        type="checkbox"
        className="theme-switch__input"
        onChange={toggle}
        checked={isDark}
        aria-hidden="true"
      />
      <div className="theme-switch__track">
        <div className="theme-switch__stars" />
        <div className="shooting-star" />
        <div className="theme-switch__clouds">
          <div className="cloud cloud--1" />
          <div className="cloud cloud--2" />
        </div>
        <div className="theme-switch__orb">
          <div className="crater crater--1" />
          <div className="crater crater--2" />
          <div className="crater crater--3" />
        </div>
      </div>
    </label>
  )
}
