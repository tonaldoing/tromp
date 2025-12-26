import {
  // Personas
  User,
  UserCheck,
  UserPlus,
  Smile,
  Meh,
  Frown,
  Ghost,
  Skull,
  Baby,
  Cat,
  Dog,
  Heart,
  Star,
  Zap,
  Crown,
  // Categorías
  ShoppingCart,
  Home,
  Car,
  Utensils,
  Coffee,
  Beer,
  Tv,
  Smartphone,
  Wifi,
  Gift,
  Briefcase,
  Plane,
  Hammer,
  Stethoscope,
  GraduationCap,
  // Métodos de Pago
  CreditCard,
  Banknote,
  Wallet,
  QrCode,
} from 'lucide-vue-next'

// Mapa: Nombre (String) -> Componente
export const ICONOS_DISPONIBLES: Record<string, any> = {
  // Personas
  user: User,
  'user-check': UserCheck,
  smile: Smile,
  meh: Meh,
  ghost: Ghost,
  skull: Skull,
  baby: Baby,
  cat: Cat,
  dog: Dog,
  heart: Heart,
  star: Star,
  zap: Zap,
  crown: Crown,

  // Categorías
  shopping: ShoppingCart,
  home: Home,
  car: Car,
  food: Utensils,
  coffee: Coffee,
  beer: Beer,
  tv: Tv,
  phone: Smartphone,
  wifi: Wifi,
  gift: Gift,
  work: Briefcase,
  travel: Plane,
  health: Stethoscope,

  // Pagos
  card: CreditCard,
  cash: Banknote,
  wallet: Wallet,
  qr: QrCode,
}

// Función helper para obtener el icono
export const getIcono = (nombre: string) => {
  return ICONOS_DISPONIBLES[nombre] || User // Si no encuentra, devuelve User por defecto
}
