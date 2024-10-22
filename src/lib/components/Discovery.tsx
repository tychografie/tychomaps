/* eslint-disable @next/next/no-img-element */
import { memo } from "react"

interface DiscoveryProps {
  href: string
  image: string
  name: string
  text: string
  rating: string
  location: string
}

export const Discovery = memo<DiscoveryProps>((props) => {
  return (
    <a
      href={props.href}
      target="_blank"
      className="flex items-stretch bg-white shadow-sm transition-transform duration-300 ease-in-out hover:scale-[1.02]"
    >
      <img
        src={props.image}
        alt={props.name}
        className="w-24 object-cover object-center rounded-tl-md rounded-bl-md"
      />
      <div className="p-4 flex-grow rounded-tr-md rounded-br-md border-t border-r border-b border-gray-200">
        <h3>{props.name}</h3>
        <p className="text-sm line-clamp-2">{props.text}</p>
        <p className="text-sm flex items-center text-purple mt-1">
          <img
            src="/img/icons/star.svg"
            alt="Rating"
            className="w-3 h-3 mr-1 invert"
          />
          {props.rating} - {props.location}
        </p>
      </div>
    </a>
  )
})

Discovery.displayName = "Discovery"
