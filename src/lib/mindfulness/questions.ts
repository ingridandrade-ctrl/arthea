/**
 * Textos oficiais dos questionários, mantidos em servidor único pra
 * garantir que cálculo e exibição usem exatamente os mesmos itens.
 *
 * Fontes verificadas: PDF (Questionários FFMQ e DASS — FUND) e planilha
 * (TABELAS_FFMQ_DASS_CAMM_Fund26.xlsx).
 */

export const FFMQ_QUESTIONS: readonly string[] = [
  "Quando estou caminhando, eu deliberadamente percebo as sensações do meu corpo em movimento.",
  "Sou bom para encontrar palavras que descrevam os meus sentimentos.",
  "Eu me critico por ter emoções irracionais ou inapropriadas.",
  "Eu percebo meus sentimentos e emoções sem ter que reagir a eles.",
  "Quando faço algo, minha mente voa e me distraio facilmente.",
  "Quando eu tomo banho, eu fico atento(a) às sensações da água no meu corpo.",
  "Eu consigo facilmente descrever minhas crenças, opiniões e expectativas em palavras.",
  "Eu não presto atenção no que faço porque fico sonhando acordado(a), preocupado(a) com outras coisas ou distraído(a).",
  "Eu observo meus sentimentos sem me perder neles.",
  "Eu digo a mim mesmo(a) que não deveria me sentir da forma como estou me sentindo.",
  "Eu percebo como a comida e a bebida afetam meus pensamentos, minhas sensações corporais e emoções.",
  "É difícil para mim encontrar palavras para descrever o que estou pensando.",
  "Eu me distraio facilmente.",
  "Eu acredito que alguns dos meus pensamentos são maus ou anormais e que eu não deveria pensar dessa forma.",
  "Eu presto atenção em sensações, tais como o vento no meu cabelo ou o sol no meu rosto.",
  "Eu tenho problemas para encontrar as palavras certas para expressar como me sinto sobre as coisas.",
  "Eu faço julgamentos sobre se os meus pensamentos são bons ou maus.",
  "Eu acho difícil permanecer focado no que está acontecendo no presente.",
  "Geralmente, quando tenho imagens ou pensamentos ruins, eu “dou um passo atrás” e tomo consciência do pensamento ou imagem sem ser levado por eles.",
  "Eu presto atenção aos sons, tais como o tic-tac do relógio, o canto dos pássaros ou dos carros passando.",
  "Em situações difíceis eu consigo fazer uma pausa, sem reagir imediatamente.",
  "Quando tenho uma sensação no meu corpo, é difícil para mim descrevê-la porque não consigo encontrar as palavras certas.",
  "Parece que eu estou “funcionando em piloto automático” sem muita consciência do que estou fazendo.",
  "Geralmente, quando tenho imagens ou pensamentos ruins, eu me sinto calmo(a) logo depois.",
  "Eu digo a mim mesmo(a) que não deveria pensar da forma como estou pensando.",
  "Eu percebo o cheiro e o aroma das coisas.",
  "Mesmo quando me sinto terrivelmente aborrecido, consigo encontrar uma maneira de me expressar em palavras.",
  "Eu realizo atividades apressadamente sem estar realmente atento(a) a elas.",
  "Geralmente, quando tenho imagens ou pensamentos aflitivos, eu sou capaz de notá-los, sem reagir a eles.",
  "Eu acho que algumas das minhas emoções são más e inapropriadas e que eu não deveria senti-las.",
  "Eu percebo elementos visuais na arte ou na natureza, tais como: cores, formatos, texturas ou padrões de luz e sombras.",
  "Minha tendência natural é colocar as minhas experiências em palavras.",
  "Geralmente, quando tenho imagens ou pensamentos ruins, eu apenas os percebo e os deixo ir.",
  "Eu realizo tarefas automaticamente, sem prestar atenção no que estou fazendo.",
  "Normalmente, quando tenho pensamentos ruins ou imagens estressantes, eu me julgo como bom(boa) ou mau(má), dependendo do tipo de imagens ou pensamentos.",
  "Eu presto atenção em como minhas emoções afetam meus pensamentos e comportamentos.",
  "Normalmente eu consigo descrever detalhadamente como me sinto no momento presente.",
  "Eu me pego fazendo coisas sem prestar atenção a elas.",
  "Eu me reprovo quando tenho ideias irracionais.",
];

export const DASS_QUESTIONS: readonly string[] = [
  "Achei difícil me acalmar.",
  "Senti minha boca seca.",
  "Não consegui vivenciar nenhum sentimento positivo.",
  "Tive dificuldade de respirar em alguns momentos (por ex.: respiração ofegante ou falta de ar sem ter feito nenhum esforço físico).",
  "Achei difícil ter iniciativa para fazer as coisas.",
  "Tive a tendência de reagir de forma exagerada às situações.",
  "Senti tremores (por ex.: nas mãos).",
  "Senti que estava sempre nervoso(a).",
  "Preocupei-me com situações em que eu pudesse entrar em pânico e parecesse ridículo(a).",
  "Senti que não tinha nada a desejar.",
  "Senti-me agitado.",
  "Achei difícil relaxar.",
  "Senti-me depressivo(a) e sem ânimo.",
  "Fui intolerante com as coisas que me impediam de continuar o que eu estava fazendo.",
  "Senti que ia entrar em pânico.",
  "Não consegui me entusiasmar com nada.",
  "Senti que não tinha valor como pessoa.",
  "Senti que estava um pouco emotivo(a)/sensível demais.",
  "Senti que meu coração estava alterado mesmo não tendo feito nenhum esforço físico (por ex.: aumento da frequência cardíaca, disritmia cardíaca).",
  "Senti medo sem motivo.",
  "Senti que a vida não tinha sentido.",
];

export const FFMQ_SCALE: readonly { val: number; label: string }[] = [
  { val: 1, label: "Nunca ou raramente verdadeiro" },
  { val: 2, label: "Às vezes verdadeiro" },
  { val: 3, label: "Não tenho certeza" },
  { val: 4, label: "Normalmente verdadeiro" },
  { val: 5, label: "Quase sempre ou sempre verdadeiro" },
];

export const DASS_SCALE: readonly { val: number; label: string }[] = [
  { val: 0, label: "Não se aplicou de maneira alguma" },
  { val: 1, label: "Aplicou-se em algum grau, ou por pouco tempo" },
  { val: 2, label: "Aplicou-se em um grau considerável, ou por uma boa parte do tempo" },
  { val: 3, label: "Aplicou-se muito, ou na maioria do tempo" },
];
