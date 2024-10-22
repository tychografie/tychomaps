/* eslint-disable @next/next/no-img-element */
import { memo } from "react"
import { useMounted } from "../utils/useMounted"

// Image files in /public/places
const imageFiles = [
  "1-Dedaena-Bar-in-Tblisi.jpg",
  "2-Taberna-Muguruza-near-San-Sebastian.jpeg",
  "3-Latei-in-Amsterdam.jpg",
  "4-La-Recyclerie-in-Paris.jpg",
  "5-Zawya-arthouse-cinema-in-Cairo.jpg",
  "6-Restaurant-Pof-in-Amsterdam.jpg",
  "7-Trattoria-la-Madonnina.jpg",
  "8-Trattoria-di-Via-Serra-in-Bologna.jpeg",
  "9-Bar-Franco-in-Nijmegen.jpeg",
  "Art-Gecko-in-Chicago.jpeg",
  "Bay-Grape-in-Oakland.jpeg",
  "Book-World-in-Dubai.jpg",
  "Colors-of-Surfing-in-Biarritz.jpeg",
  "Gjiri-i-Grames-in-Albania.jpeg",
  "Hartshorns-Organic-Farm-in-Vermont.jpeg",
  "Jazz-Corner-in-Paris.jpeg",
  "Kinotto-Bar-in-Bologna.jpeg",
  "La-Playa-Carrizalillo-in-Puerto-Escondido.jpeg",
  "Los-Danzantes-in-Oacaxa.jpeg",
  "Syra-Coffee-in-San-Sebastian.jpeg",
  "Vejers-Strand-Camping.jpg",
  "WEDGE-surfboards-Barcelona.jpg",
]

function formatImageName(filename: string) {
  return filename
    .replace(/^\d+-/, "")
    .replace(/-/g, " ")
    .replace(".jpg", "")
    .replace(".jpeg", "")
}

export const HeroBoxImage = memo(() => {
  const mounted = useMounted()
  const randomImageName =
    imageFiles[Math.floor(Math.random() * imageFiles.length)]
  const formattedImageName = formatImageName(randomImageName)
  return (
    <div className="bg-black/5 rounded-md relative h-44 md:h-auto md:w-2/5 flex-none md:max-h-full">
      {mounted && (
        <>
          <div className="relative h-full">
            <img
              src={`/places/${randomImageName}`}
              alt="No image"
              className="animation-delayed rounded-md h-full w-full object-cover block object-center absolute inset-0"
            />
          </div>
          <div className="animation-delayed-text max-w-fit rounded-md absolute bottom-2 left-2 right-2 bg-[#222222] p-2 text-center">
            <p className="text-white/70 text-xs tracking-wider font-semibold">
              {formattedImageName}
            </p>
          </div>
        </>
      )}
    </div>
  )
})

HeroBoxImage.displayName = "HeroBoxImage"
