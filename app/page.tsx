"use client";

import { CircleNotch, MagnifyingGlass, Robot, User } from "@phosphor-icons/react";
import axios from "axios";
import { type FormEvent, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from 'remark-gfm'
import { toast } from "sonner";
import { v4 as uuid } from "uuid";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
	id: string;
	text: string;
	isMine: boolean;
}

export default function Home() {
	const [message, setMessage] = useState("");
	const [messages, setMessages] = useState<Message[]>([]);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();

		if (!message) return;

		setMessage("");

		setLoading(true);

		setMessages((prev) => [
			...prev,
			{
				id: uuid(),
				text: message,
				isMine: true,
			},
		]);

		try {
			const response = await axios.post("/api/ai", { message });
			const data = response.data;

			setMessages((prev) => [
				...prev,
				{
					id: uuid(),
					text: data.answer,
					isMine: false,
				},
			]);
      
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		} catch (error: any) {
			toast.error(error.response?.data?.error ?? error?.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<main className="h-screen w-full flex items-center justify-center">
			<section className="max-w-[600px] w-full flex flex-col">
				{messages.length > 0 && (
					<div className="p-6 flex flex-col gap-4 h-[400px] overflow-auto rounded-md border">
						{messages.map((message) => (
							<div
								key={message.id}
								className={cn(
									"flex items-start gap-2 ",
									message.isMine && "justify-start flex-row-reverse",
								)}
							>
                <div className='p-2 rounded-md border bg-input/30'>
                  {message.isMine ? (
                    <User size={20} className='text-white' weight='light'  />
                  ) : (
                    <Robot size={20} className='text-white' weight='light'  />
                  )}
                </div>
                
								{message.isMine ? (
									<p className="rounded-md max-w-fit text-justify p-2 border bg-input/30">
										{message.text}
									</p>
								) : (
									<div className="flex flex-col text-justify p-2 rounded-md border bg-input/30">
										<Markdown remarkPlugins={[remarkGfm]}>{message.text}</Markdown>
									</div>
								)}
							</div>
						))}
					</div>
				)}

				<form className="mt-4 flex items-center gap-2" onSubmit={handleSubmit}>
					<Input
						className="h-10"
						placeholder="Pesquise alguma coisa no banco de dados..."
						value={message}
						disabled={loading}
						onChange={(e) => setMessage(e.target.value)}
					/>

					<Button
						type="submit"
						className="cursor-pointer"
						disabled={loading}
					>
						{loading ? (
							<CircleNotch className="animate-spin" />
						) : (
							<MagnifyingGlass />
						)}
					</Button>
				</form>
			</section>
		</main>
	);
}
