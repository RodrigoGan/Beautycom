/**
 * Utilitários para encoding correto de mensagens WhatsApp
 */

/**
 * Converte emojis para formato compatível com WhatsApp
 * @param text - Texto com emojis
 * @returns Texto com emojis convertidos
 */
export const convertEmojisForWhatsApp = (text: string): string => {
  // Mapeamento de emojis problemáticos para versões compatíveis
  const emojiMap: Record<string, string> = {
    '🎉': '🎉', // Confetti ball
    '✨': '✨', // Sparkles
    '⏰': '⏰', // Alarm clock
    '🔗': '🔗', // Link
    '👋': '👋', // Waving hand
    '💄': '💄', // Lipstick
    '💅': '💅', // Nail polish
    '💇': '💇', // Haircut
    '💆': '💆', // Face massage
    '🌟': '🌟', // Star
    '💫': '💫', // Dizzy star
    '🎨': '🎨', // Artist palette
    '💎': '💎', // Gem stone
    '🔥': '🔥', // Fire
    '💯': '💯', // Hundred points
    '✅': '✅', // Check mark
    '❌': '❌', // Cross mark
    '⚠️': '⚠️', // Warning
    '📱': '📱', // Mobile phone
    '💻': '💻', // Laptop
    '🌐': '🌐', // Globe
    '📞': '📞', // Telephone
    '📧': '📧', // Email
    '📍': '📍', // Round pushpin
    '🏠': '🏠', // House
    '🏢': '🏢', // Office building
    '💼': '💼', // Briefcase
    '🎯': '🎯', // Direct hit
    '🚀': '🚀', // Rocket
    '⭐': '⭐', // White medium star
    '💝': '💝', // Heart with ribbon
    '🎁': '🎁', // Wrapped gift
    '🎊': '🎊', // Confetti ball
    '🎈': '🎈', // Balloon
    '🎂': '🎂', // Birthday cake
    '🍰': '🍰', // Shortcake
    '☕': '☕', // Hot beverage
    '🍕': '🍕', // Pizza
    '🍔': '🍔', // Hamburger
    '🍟': '🍟', // French fries
    '🍦': '🍦', // Soft ice cream
    '🍩': '🍩', // Doughnut
    '🍪': '🍪', // Cookie
    '🍫': '🍫', // Chocolate bar
    '🍭': '🍭', // Lollipop
    '🍬': '🍬', // Candy
    '🍯': '🍯', // Honey pot
    '🍎': '🍎', // Red apple
    '🍊': '🍊', // Tangerine
    '🍋': '🍋', // Lemon
    '🍌': '🍌', // Banana
    '🍉': '🍉', // Watermelon
    '🍇': '🍇', // Grapes
    '🍓': '🍓', // Strawberry
    '🍑': '🍑', // Peach
    '🍒': '🍒', // Cherries
    '🥝': '🥝', // Kiwi fruit
    '🍅': '🍅', // Tomato
    '🥕': '🥕', // Carrot
    '🌽': '🌽', // Ear of corn
    '🌶️': '🌶️', // Hot pepper
    '🥒': '🥒', // Cucumber
    '🥬': '🥬', // Leafy green
    '🥦': '🥦', // Broccoli
    '🍄': '🍄', // Mushroom
    '🥜': '🥜', // Peanuts
    '🌰': '🌰', // Chestnut
    '🍞': '🍞', // Bread
    '🥖': '🥖', // Baguette bread
    '🥨': '🥨', // Pretzel
    '🥯': '🥯', // Bagel
    '🥞': '🥞', // Pancakes
    '🧀': '🧀', // Cheese wedge
    '🥚': '🥚', // Egg
    '🍳': '🍳', // Cooking
    '🥓': '🥓', // Bacon
    '🥩': '🥩', // Cut of meat
    '🍖': '🍖', // Meat on bone
    '🍗': '🍗', // Poultry leg
    '🥘': '🥘', // Shallow pan of food
    '🍲': '🍲', // Pot of food
    '🥗': '🥗', // Green salad
    '🍿': '🍿', // Popcorn
    '🧈': '🧈', // Butter
    '🧂': '🧂', // Salt
    '🥫': '🥫', // Canned food
    '🍱': '🍱', // Bento box
    '🍘': '🍘', // Rice cracker
    '🍙': '🍙', // Onigiri
    '🍚': '🍚', // Cooked rice
    '🍛': '🍛', // Curry rice
    '🍜': '🍜', // Steaming bowl
    '🍝': '🍝', // Spaghetti
    '🍠': '🍠', // Roasted sweet potato
    '🍢': '🍢', // Oden
    '🍣': '🍣', // Sushi
    '🍤': '🍤', // Fried shrimp
    '🍥': '🍥', // Fish cake with swirl
    '🥮': '🥮', // Moon cake
    '🍡': '🍡', // Dango
    '🥟': '🥟', // Dumpling
    '🥠': '🥠', // Fortune cookie
    '🥡': '🥡', // Takeout box
    '🦀': '🦀', // Crab
    '🦞': '🦞', // Lobster
    '🦐': '🦐', // Shrimp
    '🦑': '🦑', // Squid
    '🦪': '🦪', // Oyster
    '🍦': '🍦', // Soft ice cream
    '🍧': '🍧', // Shaved ice
    '🍨': '🍨', // Ice cream
    '🍩': '🍩', // Doughnut
    '🍪': '🍪', // Cookie
    '🎂': '🎂', // Birthday cake
    '🍰': '🍰', // Shortcake
    '🧁': '🧁', // Cupcake
    '🥧': '🥧', // Pie
    '🍫': '🍫', // Chocolate bar
    '🍬': '🍬', // Candy
    '🍭': '🍭', // Lollipop
    '🍮': '🍮', // Custard
    '🍯': '🍯', // Honey pot
    '🍼': '🍼', // Baby bottle
    '🥛': '🥛', // Glass of milk
    '☕': '☕', // Hot beverage
    '🍵': '🍵', // Teacup without handle
    '🍶': '🍶', // Sake
    '🍾': '🍾', // Bottle with popping cork
    '🍷': '🍷', // Wine glass
    '🍸': '🍸', // Cocktail glass
    '🍹': '🍹', // Tropical drink
    '🍺': '🍺', // Beer mug
    '🍻': '🍻', // Clinking beer mugs
    '🥂': '🥂', // Clinking glasses
    '🥃': '🥃', // Tumbler glass
    '🥤': '🥤', // Cup with straw
    '🧃': '🧃', // Beverage box
    '🧉': '🧉', // Mate
    '🧊': '🧊', // Ice
  }

  let convertedText = text

  // Aplicar conversões do mapeamento
  Object.entries(emojiMap).forEach(([original, converted]) => {
    convertedText = convertedText.replace(new RegExp(original, 'g'), converted)
  })

  return convertedText
}

/**
 * Prepara mensagem para envio no WhatsApp com encoding correto
 * @param message - Mensagem original
 * @returns Mensagem preparada para WhatsApp
 */
export const prepareMessageForWhatsApp = (message: string): string => {
  // Converter emojis para formato compatível
  let preparedMessage = convertEmojisForWhatsApp(message)
  
  // Garantir que a mensagem está em UTF-8
  preparedMessage = preparedMessage.normalize('NFC')
  
  // Remover caracteres de controle problemáticos
  preparedMessage = preparedMessage.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  
  return preparedMessage
}

/**
 * Testa se uma mensagem contém emojis válidos
 * @param message - Mensagem para testar
 * @returns true se contém emojis válidos
 */
export const hasValidEmojis = (message: string): boolean => {
  // Regex para detectar emojis válidos
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu
  
  return emojiRegex.test(message)
}

/**
 * Debug: mostra informações sobre emojis na mensagem
 * @param message - Mensagem para analisar
 */
export const debugEmojis = (message: string): void => {
  console.log('🔍 Debug de Emojis:')
  console.log('Mensagem original:', message)
  console.log('Tamanho em bytes:', new TextEncoder().encode(message).length)
  console.log('Tem emojis válidos:', hasValidEmojis(message))
  
  // Mostrar cada caractere com seu código
  for (let i = 0; i < message.length; i++) {
    const char = message[i]
    const code = char.codePointAt(0)
    if (code && code > 127) {
      console.log(`Posição ${i}: "${char}" (U+${code.toString(16).toUpperCase()})`)
    }
  }
}
