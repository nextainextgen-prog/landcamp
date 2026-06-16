import type { Room } from "@/types";

/**
 * Four LandCamp accommodation types.
 *
 * Data here is the source of truth for both the rooms section and any
 * future Supabase mirror. Each amenity entry is a bilingual short phrase
 * (no full sentences).
 */
export const rooms: Room[] = [
  {
    id: "villa-1bed",
    type: "villa-1bed",
    name: {
      th: "วิลล่า 1 · Villa 1",
      en: "Villa 1",
    },
    description: {
      th: "วิลล่าโมเดิร์น ผนังกระจกบานสูงเปิดวิวสวน อ่างแช่ริมลำธารนอกตัวบ้าน เหมาะสำหรับคู่รักหรือทริปส่วนตัว",
      en: "A modern villa with floor-to-ceiling glass and a private soaking tub by the stream — ideal for couples seeking total privacy.",
    },
    priceWeekday: 4500,
    priceWeekend: 5500,
    maxGuests: 2,
    amenities: [
      { th: "ผนังกระจกเปิดวิวสวน", en: "Floor-to-ceiling glass" },
      { th: "อ่างแช่นอกตัวบ้าน", en: "Outdoor soaking tub" },
      { th: "ลำธารส่วนตัวข้างห้อง", en: "Private stream-side" },
      { th: "Marshall Speaker", en: "Marshall Speaker" },
      { th: "เครื่องชงกาแฟแคปซูล", en: "Capsule coffee maker" },
      { th: "เครื่องปรับอากาศ", en: "Air conditioning" },
    ],
    images: [
      {
        src: "/images/rooms/villa-1bed/cover.jpg",
        alt: { th: "วิลล่า 1 ห้องนอน — มุมเตียงเปิดวิวสวน", en: "Villa 1 Bedroom — bedroom with garden view" },
      },
      {
        src: "/images/rooms/villa-1bed/detail-01.jpg",
        alt: { th: "ระเบียงมองออกสวน", en: "Deck through the trees" },
      },
      {
        src: "/images/rooms/villa-1bed/detail-02.jpg",
        alt: { th: "อ่างแช่นอกตัวบ้าน", en: "Outdoor soaking tub" },
      },
      {
        src: "/images/rooms/villa-1bed/detail-03.jpg",
        alt: { th: "วิลล่ามุมภายนอก ผนังกระจกบานสูง", en: "Villa exterior with floor-to-ceiling glass" },
      },
      {
        src: "/images/rooms/villa-1bed/detail-04.jpg",
        alt: { th: "ห้องนอนพร้อมทีวีและตู้ไม้สัก", en: "Bedroom with TV and teak cabinetry" },
      },
      {
        src: "/images/rooms/villa-1bed/detail-05.jpg",
        alt: { th: "มุมมองทั้งห้อง ผนังกระจกเปิดสวน", en: "Wide bedroom with glass wall to garden" },
      },
      {
        src: "/images/rooms/villa-1bed/detail-06.jpg",
        alt: { th: "อ่างแช่ริมลำธาร", en: "Soaking tub overlooking the stream" },
      },
      {
        src: "/images/rooms/villa-1bed/detail-07.jpg",
        alt: { th: "Marshall Speaker ข้างเตียง", en: "Marshall speaker on the nightstand" },
      },
      {
        src: "/images/rooms/villa-1bed/detail-08.jpg",
        alt: { th: "ห้องน้ำหินอ่อนเทา", en: "Grey marble bathroom" },
      },
      {
        src: "/images/rooms/villa-1bed/detail-09.jpg",
        alt: { th: "เตียงเฟอร์นิเจอร์ไม้รัตตัน", en: "Rattan bed and natural wood furniture" },
      },
      {
        src: "/images/rooms/villa-1bed/detail-10.jpg",
        alt: { th: "ห้องอาบน้ำพร้อมฝักบัวเรน", en: "Walk-in shower with rain head" },
      },
      {
        src: "/images/rooms/villa-1bed/detail-11.jpg",
        alt: { th: "ตัวบ้านหินธรรมชาติพร้อมประตูไม้", en: "Stone-clad facade with timber door" },
      },
      {
        src: "/images/rooms/villa-1bed/detail-12.jpg",
        alt: { th: "ระเบียงไม้พร้อมเก้าอี้ Adirondack", en: "Wood deck with Adirondack chairs" },
      },
      {
        src: "/images/rooms/villa-1bed/detail-13.jpg",
        alt: { th: "วิลล่าซ่อนตัวในพุ่มไม้", en: "Villa nestled in the trees" },
      },
      {
        src: "/images/rooms/villa-1bed/detail-14.jpg",
        alt: { th: "ผนังกระจกเปิดมุมห้องนอน", en: "Glass facade revealing the bedroom" },
      },
    ],
    available: true,
  },
  {
    id: "villa-2bed",
    type: "villa-2bed",
    name: {
      th: "วิลล่า 2 · Villa 2",
      en: "Villa 2",
    },
    description: {
      th: "วิลล่าหลังใหญ่ที่สุดของแลนด์แคมป์ พักได้ 4 ท่าน มีพื้นที่ Dining และระเบียงรอบบ้าน เหมาะสำหรับครอบครัวหรือกลุ่มเพื่อน",
      en: "Our largest villa for up to four guests — full dining area, wraparound terrace, designed for family stays and small celebrations.",
    },
    priceWeekday: 6500,
    priceWeekend: 7500,
    maxGuests: 4,
    amenities: [
      { th: "2 ห้องนอน พักได้ 4 ท่าน", en: "2 bedrooms · sleeps 4" },
      { th: "พื้นที่ Dining ในตัว", en: "Indoor dining area" },
      { th: "ระเบียงรอบตัวบ้าน", en: "Wraparound terrace" },
      { th: "ห้องน้ำ 2 ห้อง", en: "Two bathrooms" },
      { th: "Marshall Speaker", en: "Marshall Speaker" },
      { th: "เครื่องชงกาแฟแคปซูล", en: "Capsule coffee maker" },
    ],
    images: [
      {
        src: "/images/rooms/villa-2bed/cover.jpg",
        alt: { th: "วิลล่า 2 ห้องนอน — ห้องนอนรองเปิดวิวสวน", en: "Villa 2 Bedrooms — guest bedroom with garden view" },
      },
      {
        src: "/images/rooms/villa-2bed/detail-01.jpg",
        alt: { th: "ห้องนอนรองพร้อมเตียงคิงและภาพศิลปะ", en: "Second bedroom with king bed and wall art" },
      },
      {
        src: "/images/rooms/villa-2bed/detail-02.jpg",
        alt: { th: "ตัวบ้านหินธรรมชาติริมลำธาร", en: "Stone-clad villa beside the stream" },
      },
      {
        src: "/images/rooms/villa-2bed/detail-03.jpg",
        alt: { th: "ระเบียงไม้เลียบลำธารหินธรรมชาติ", en: "Wood walkway along the natural stream" },
      },
      {
        src: "/images/rooms/villa-2bed/detail-04.jpg",
        alt: { th: "ห้องน้ำผนังไม้พร้อมฝักบัวเรน", en: "Wood-panel bathroom with rain shower" },
      },
      {
        src: "/images/rooms/villa-2bed/detail-05.jpg",
        alt: { th: "Walk-in shower ผนังไม้", en: "Walk-in shower with timber walls" },
      },
      {
        src: "/images/rooms/villa-2bed/detail-06.jpg",
        alt: { th: "อ่างล้างหน้าและกระจกกลม", en: "Vanity with round mirror" },
      },
      {
        src: "/images/rooms/villa-2bed/detail-07.jpg",
        alt: { th: "มุมห้องน้ำกับบันไดไม้ไผ่", en: "Bathroom with bamboo towel ladder" },
      },
      {
        src: "/images/rooms/villa-2bed/detail-08.jpg",
        alt: { th: "ห้องนั่งเล่นเปิดวิวต้นไม้", en: "Lounge with garden window" },
      },
      {
        src: "/images/rooms/villa-2bed/detail-09.jpg",
        alt: { th: "ห้องนอนหลักเปิดมุมกระจกบานสูง", en: "Master bedroom with floor-to-ceiling glass" },
      },
      {
        src: "/images/rooms/villa-2bed/detail-10.jpg",
        alt: { th: "โซฟาผ้าครีมหน้าหน้าต่างไม้สัก", en: "Cream sofa under teak-framed window" },
      },
      {
        src: "/images/rooms/villa-2bed/detail-11.jpg",
        alt: { th: "ห้องน้ำผนังไม้พร้อมอ่างแช่และสวนหลัง", en: "Wood bathroom with soaking tub and rear garden" },
      },
      {
        src: "/images/rooms/villa-2bed/detail-12.jpg",
        alt: { th: "อ่างแช่อิสระและตู้เก็บผ้าเชือก", en: "Freestanding tub with linen storage" },
      },
      {
        src: "/images/rooms/villa-2bed/detail-13.jpg",
        alt: { th: "Outdoor shower กับผนังหินและไม้", en: "Outdoor shower with stone and timber walls" },
      },
      {
        src: "/images/rooms/villa-2bed/detail-14.jpg",
        alt: { th: "อ่างแช่ผนังไม้เปิดสวนหลังบ้าน", en: "Soaking tub framing the back garden" },
      },
      {
        src: "/images/rooms/villa-2bed/detail-15.jpg",
        alt: { th: "ระเบียงนั่งเล่นด้านหน้าตัววิลล่าหิน", en: "Front deck of the stone villa" },
      },
      {
        src: "/images/rooms/villa-2bed/detail-16.jpg",
        alt: { th: "มุมระเบียงข้างผนังหิน", en: "Side deck against the stone wall" },
      },
      {
        src: "/images/rooms/villa-2bed/detail-17.jpg",
        alt: { th: "มุมระเบียงและประตูกระจกบานเลื่อน", en: "Deck and sliding glass entry" },
      },
      {
        src: "/images/rooms/villa-2bed/detail-18.jpg",
        alt: { th: "ลำธารส่วนตัวรอบบ้าน", en: "Private stream wrapping the villa" },
      },
      {
        src: "/images/rooms/villa-2bed/detail-19.jpg",
        alt: { th: "บานกระจกเปิดวิวภายในห้องนั่งเล่น", en: "Glass facade revealing the living room" },
      },
      {
        src: "/images/rooms/villa-2bed/detail-20.jpg",
        alt: { th: "ระเบียงและประตูกระจก มุมที่สาม", en: "Deck and glass door — alternate angle" },
      },
      {
        src: "/images/rooms/villa-2bed/detail-21.jpg",
        alt: { th: "ระเบียงและประตูกระจก มุมที่สี่", en: "Deck and glass door — wide angle" },
      },
      {
        src: "/images/rooms/villa-2bed/detail-22.jpg",
        alt: { th: "พื้นที่ Dining มองจากสวนผ่านกระจก", en: "Dining area glimpsed through the garden glass" },
      },
    ],
    available: true,
  },
  {
    id: "train",
    type: "train",
    name: {
      th: "บ้านรถไฟ · Camper Train",
      en: "Camper Train",
    },
    description: {
      th: "ตู้รถไฟไทยโบราณดัดแปลงเป็นที่พัก ผนังไม้สัก เตียง 5 ฟุต ห้องน้ำในตัว ระเบียงด้านหน้าพร้อมอ่างแช่ขนาดใหญ่",
      en: "A classic Thai railway carriage reborn as a glamping suite — teak panelling, queen bed, private ensuite and a deck with a large bathtub.",
    },
    priceWeekday: 5000,
    priceWeekend: 6000,
    maxGuests: 2,
    amenities: [
      { th: "ผนังไม้สักดั้งเดิม", en: "Original teak panelling" },
      { th: "เตียง 5 ฟุต", en: "Queen-size bed" },
      { th: "อ่างแช่หน้าระเบียง", en: "Deck-side bathtub" },
      { th: "ห้องน้ำในตัว", en: "Private ensuite" },
      { th: "Marshall Speaker", en: "Marshall Speaker" },
      { th: "ทีวี + ตู้เย็น", en: "TV + mini fridge" },
    ],
    images: [
      {
        src: "/images/rooms/train/cover.jpg",
        alt: { th: "บ้านรถไฟ — ห้องนอนเตียงคู่ใต้เพดานโค้ง", en: "Camper Train — bed under the arched carriage ceiling" },
      },
      {
        src: "/images/rooms/train/detail-01.jpg",
        alt: { th: "มุมสูงระเบียงไม้ใต้ต้นสน", en: "Aerial of the timber deck nestled under pines" },
      },
      {
        src: "/images/rooms/train/detail-02.jpg",
        alt: { th: "ตู้รถไฟท่ามกลางแนวต้นสน", en: "The carriage framed by tall pine trees" },
      },
      {
        src: "/images/rooms/train/detail-03.jpg",
        alt: { th: "อ่างแช่กลางแจ้งล้อมรอบด้วยผนังไม้และไฟราว", en: "Outdoor soaking tub with timber walls and festoon lights" },
      },
      {
        src: "/images/rooms/train/detail-04.jpg",
        alt: { th: "มุมสูงสนามหญ้าและทางเดินหิน", en: "Aerial view of the lawn and stepping-stone path" },
      },
      {
        src: "/images/rooms/train/detail-05.jpg",
        alt: { th: "ระเบียงไม้พร้อมเก้าอี้พักผ่อนใต้ร่ม", en: "Timber deck with lounge chairs under a cantilever umbrella" },
      },
      {
        src: "/images/rooms/train/detail-06.jpg",
        alt: { th: "ทางเดินไม้แคบเลียบตัวรถไฟ", en: "Narrow boardwalk running alongside the carriage" },
      },
      {
        src: "/images/rooms/train/detail-07.jpg",
        alt: { th: "ด้านข้างตู้รถไฟพร้อมประตูบานเลื่อนกระจก", en: "Carriage flank with sliding glass door to the deck" },
      },
      {
        src: "/images/rooms/train/detail-08.jpg",
        alt: { th: "มุมเครื่องดื่มกับลำโพง Marshall และตู้เย็นวินเทจ", en: "Pantry corner with Marshall speaker and vintage mini fridge" },
      },
      {
        src: "/images/rooms/train/detail-09.jpg",
        alt: { th: "ด้านหน้าตู้รถไฟกลางหมู่ต้นสน", en: "Front of the carriage among Norfolk pines" },
      },
      {
        src: "/images/rooms/train/detail-10.jpg",
        alt: { th: "ระเบียงไม้พร้อมโต๊ะยาวและที่นั่งคู่", en: "Timber deck with long table and paired loungers" },
      },
      {
        src: "/images/rooms/train/detail-11.jpg",
        alt: { th: "มุมระเบียงไม้กว้างกับวิวต้นไม้", en: "Wide deck angle opening to the garden trees" },
      },
      {
        src: "/images/rooms/train/detail-12.jpg",
        alt: { th: "มุมเก้าอี้ไม้มองออกสนามหญ้า", en: "Adirondack chair facing the open lawn" },
      },
      {
        src: "/images/rooms/train/detail-13.jpg",
        alt: { th: "มุมระเบียงและทางเดินไม้ยามบ่าย", en: "Deck and boardwalk in afternoon light" },
      },
      {
        src: "/images/rooms/train/detail-14.jpg",
        alt: { th: "มุมพักผ่อนระเบียงพร้อมเก้าอี้คู่", en: "Twin recliners on the deck under the umbrella" },
      },
      {
        src: "/images/rooms/train/detail-15.jpg",
        alt: { th: "ผู้เข้าพักนั่งอ่านหนังสือพิมพ์บนระเบียง", en: "A guest reading the paper on the deck" },
      },
      {
        src: "/images/rooms/train/detail-16.jpg",
        alt: { th: "ผู้เข้าพักสวมหมวกฟางพักผ่อนใต้ร่ม", en: "A guest in a straw hat relaxing under the parasol" },
      },
      {
        src: "/images/rooms/train/detail-17.jpg",
        alt: { th: "ผู้เข้าพักก้าวออกจากประตูตู้รถไฟ", en: "A guest stepping out of the carriage door" },
      },
      {
        src: "/images/rooms/train/detail-18.jpg",
        alt: { th: "ภาพพอร์ตเทรตท่ามกลางใบสน", en: "Portrait among the pine fronds" },
      },
    ],
    available: true,
  },
  {
    id: "camper",
    type: "camper",
    name: {
      th: "รถบ้าน · Camper Van",
      en: "Camper Van",
    },
    description: {
      th: "รถบ้านสไตล์อังกฤษบอดี้เงิน ตกแต่งภายในอบอุ่นเป็นกันเอง ล้อมรอบด้วยต้นอะกาเว่ ให้ฟีลเหมือนหลุดไปนิวซีแลนด์",
      en: "A British-style silver camper wrapped in agave gardens — cosy interior, photogenic exterior, the feel of a Pacific Northwest road trip.",
    },
    priceWeekday: 4500,
    priceWeekend: 5500,
    maxGuests: 2,
    amenities: [
      { th: "บอดี้เงินสไตล์อังกฤษ", en: "British silver camper body" },
      { th: "ภายในตกแต่งเป็นกันเอง", en: "Cosy boutique interior" },
      { th: "ห้องน้ำส่วนตัวข้างรถ", en: "Adjacent private bathroom" },
      { th: "ลานนั่งเล่นรายล้อมอะกาเว่", en: "Agave-lined patio" },
      { th: "Marshall Speaker", en: "Marshall Speaker" },
      { th: "เครื่องปรับอากาศ", en: "Air conditioning" },
    ],
    images: [
      {
        src: "/images/rooms/camper/cover.jpg",
        alt: { th: "รถบ้าน — เตียงคิงในห้องนอนสไตล์ Airstream", en: "Camper Van — king bed inside the Airstream cabin" },
      },
      {
        src: "/images/rooms/camper/detail-01.jpg",
        alt: { th: "มุมห้องนั่งเล่นพร้อม Marshall, ทีวี และตู้เย็นวินเทจ", en: "Lounge corner with Marshall speaker, TV and vintage mini fridge" },
      },
      {
        src: "/images/rooms/camper/detail-02.jpg",
        alt: { th: "เก้าอี้ทับครีมคู่ใต้เครื่องปรับอากาศ", en: "Twin cream tub chairs beneath the air conditioner" },
      },
      {
        src: "/images/rooms/camper/detail-03.jpg",
        alt: { th: "ห้องน้ำส่วนตัว พร้อม walk-in shower และโต๊ะเครื่องแป้ง", en: "Private bathroom with walk-in shower and vanity" },
      },
      {
        src: "/images/rooms/camper/detail-04.jpg",
        alt: { th: "อ่างแช่อิสระมองออกป่าสน", en: "Freestanding tub looking out to pine trees" },
      },
      {
        src: "/images/rooms/camper/detail-05.jpg",
        alt: { th: "มุมอ่างแช่กับราวผ้าไม้ไผ่และเสื้อคลุม", en: "Tub corner with bamboo towel ladder and bathrobes" },
      },
      {
        src: "/images/rooms/camper/detail-06.jpg",
        alt: { th: "รายละเอียดโคมไฟ กระจกแต่งหน้า และก้านน้ำหอม", en: "Detail of lamp, vanity mirror and reed diffuser" },
      },
      {
        src: "/images/rooms/camper/detail-07.jpg",
        alt: { th: "ลำโพง Marshall บนตอไม้ข้างต้นมะกอก", en: "Marshall speaker on a wood stump beside the olive plant" },
      },
      {
        src: "/images/rooms/camper/detail-08.jpg",
        alt: { th: "กุญแจห้องไม้สลักโลโก้ LandCamp", en: "Engraved LandCamp wooden room-key" },
      },
      {
        src: "/images/rooms/camper/detail-09.jpg",
        alt: { th: "ระเบียงไม้ข้างบอดี้เงินสะท้อนแสง", en: "Deck beside the reflective silver body" },
      },
      {
        src: "/images/rooms/camper/detail-10.jpg",
        alt: { th: "ผู้เข้าพักนั่งอ่านหนังสือพิมพ์ริมระเบียง", en: "A guest reading the paper at the deck edge" },
      },
      {
        src: "/images/rooms/camper/detail-11.jpg",
        alt: { th: "คู่รักพักผ่อนบนระเบียงรถบ้าน", en: "A couple unwinding on the Camper deck" },
      },
      {
        src: "/images/rooms/camper/detail-12.jpg",
        alt: { th: "มุมนั่งมองสนามหญ้าและหลุมไฟ", en: "Seat facing the lawn and fire-pit garden" },
      },
      {
        src: "/images/rooms/camper/detail-13.jpg",
        alt: { th: "อ่างแช่อิสระมองวิวภูเขายามเย็น", en: "Freestanding tub with mountain view at dusk" },
      },
      {
        src: "/images/rooms/camper/detail-14.jpg",
        alt: { th: "Airstream คู่กับห้องน้ำไม้แยกหลังท่ามกลางสวนอะกาเว่", en: "Airstream paired with the timber bathhouse in an agave garden" },
      },
      {
        src: "/images/rooms/camper/detail-15.jpg",
        alt: { th: "มุมสูงเห็นระเบียงและตัวรถบ้านบอดี้เงิน", en: "Aerial of the deck and polished camper body" },
      },
      {
        src: "/images/rooms/camper/detail-16.jpg",
        alt: { th: "ภาพดิ่งมุมบนเห็นแลนด์สเคปทั้งหมด", en: "Top-down aerial of the full setting" },
      },
      {
        src: "/images/rooms/camper/detail-17.jpg",
        alt: { th: "ผู้เข้าพักนั่งพิงบอดี้รถบ้านยามเย็น", en: "A guest leaning against the camper body at golden hour" },
      },
      {
        src: "/images/rooms/camper/detail-18.jpg",
        alt: { th: "บอดี้เงินกับสวนอะกาเว่และทางเดินหิน", en: "Silver body framed by agave plants and stepping stones" },
      },
      {
        src: "/images/rooms/camper/detail-19.jpg",
        alt: { th: "มุมโครงสร้างพร้อมเก้าอี้ Adirondack และโคมไฟกลางสวน", en: "Wider setting with Adirondack chairs and garden lantern" },
      },
    ],
    available: true,
  },
];
