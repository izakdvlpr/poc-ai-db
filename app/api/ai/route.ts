import { createOpenAI } from "@ai-sdk/openai";
import { generateText, tool } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import pg from "pg";
import { z } from "zod";

const openai = createOpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

const postgresSchema = z.object({
  query: z
    .string()
    .describe("A query do PostgreSQL para ser executada."),
  params: z
    .array(z.string())
    .describe("Parâmetros da query a ser executada."),
})

async function executeQuery(query: string, params: string[]) {
  console.log({ query, params });
  
  const db = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  await db.connect()
  
  const result = await db.query(query, params);
  
  await db.end();

  return JSON.stringify(result);
}

const SQL_PROMPT = (table: string) => `
  Realiza uma query no Postgres para buscar informações sobre as tabelas do banco de dados.
  
  Só pode realizar operações de busca (SELECT), não é permitido a geração de qualquer operação de escrita.
  
  Tabela:
  
  ${table}
  
  Todas operações devem retornar um máximo de 50 itens.
`.trim();

export async function POST(request: NextRequest) {
	const body = await request.json();

	if (!body.message) {
		return NextResponse.json(
			{ error: "A mensagem é obrigatória." },
			{ status: 400 }
    );
	}

	try { 
    const answer = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `Gere a consulta necessária para recuperar os dados que o usuário deseja: ${body.message}`,
      system: `
        Você é um assistente de I.A. responsável por responder dúvidas sobre um evento de programação.
        
        Inclua na resposta somente o que o usuário pediu, sem nenhum texto adicional.
        
        O retorno deve ser sempre em markdown (sem incluir \`\`\` no início ou no fim).
      `.trim(),
      maxSteps: 5,
      tools: {
        productsFromDatabase: tool({
          description: SQL_PROMPT(`
            CREATE TABLE "Product" (
              "id" SERIAL NOT NULL,
              "name" TEXT NOT NULL,
              "price" DECIMAL(10,2) NOT NULL,
              "createdt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
            );
          `),
          parameters: postgresSchema,
          execute: async ({ query, params }) => executeQuery(query, params),
        }),
        transactionsFromDatabase: tool({
          description: SQL_PROMPT(`
            CREATE TABLE "Transaction" (
              "id" SERIAL NOT NULL,
              "value" DECIMAL(10,2) NOT NULL,
              "method" "TransactionMethod" NOT NULL,
              "productId" INTEGER NOT NULL,
              "createdt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
            );
          `),
          parameters: postgresSchema,
          execute: async ({ query, params }) => executeQuery(query, params),
        }),
      },
    });
    
    return NextResponse.json({ answer: answer.text });
  } catch (error) {
    console.log(error)
    
    return NextResponse.json(
      { error: "Ocorreu um erro ao tentar gerar a resposta." },
      { status: 500 },
    );
  }
}
