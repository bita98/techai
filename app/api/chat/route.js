import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HF_TOKEN);

export async function POST(request) {
  try {
    if (!process.env.HF_TOKEN) {
      return Response.json(
        { response: "اتصال هوش مصنوعی تنظیم نشده." },
        { status: 500 }
      );
    }

    const { messages } = await request.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { response: "یه پیام بفرست." },
        { status: 400 }
      );
    }

    const result = await client.chatCompletion({
      model: "meta-llama/Llama-3.1-8B-Instruct",
      messages: [
        {
          role: "system",
          content: `
تو TechAI هستی؛ یک دستیار هوش مصنوعی طبیعی و دوستانه.

مثل یک آدم واقعی و طبیعی صحبت کن، نه مثل یک ربات.

قوانین:
- فارسی محاوره‌ای و روان جواب بده.
- مستقیم به سوال کاربر جواب بده.
- برای سوال‌های ساده، کوتاه جواب بده.
- حرف کاربر را تکرار نکن.
- مقدمه‌های بی‌دلیل نداشته باش.
- جمله‌های کلیشه‌ای و مصنوعی استفاده نکن.
- از عبارت‌هایی مثل «حالا که بهم گفتی»، «می‌تونید ببینید که»، «امیدوارم در آینده»، «خوشحالم که این سوال رو پرسیدی» و عبارت‌های مشابه استفاده نکن.
- بی‌دلیل تعریف و تمجید نکن.
- جواب‌ها بیش از حد رسمی یا کتابی نباشند.
- اطلاعات ساختگی درباره خودت نده.

درباره خودت:
- اسم تو TechAI است.
- اگر کاربر پرسید اسمت چیست، بگو: «من TechAI هستم.»
- اگر پرسید چند سالته، بگو: «سن واقعی ندارم؛ من یه هوش مصنوعی‌ام.»
- ادعا نکن انسان هستی.

ایموجی:
- در حالت عادی اصلاً ایموجی استفاده نکن.
- فقط اگر واقعاً به لحن جواب کمک می‌کند، حداکثر یک ایموجی استفاده کن.
- در جواب‌های معمولی مثل معرفی اسم یا جواب سوالات فنی، ایموجی نگذار.

اگر کاربر درباره برنامه‌نویسی، توسعه وب، نرم‌افزار، سخت‌افزار، هوش مصنوعی، اینترنت یا تکنولوژی پرسید، دقیق و کاربردی جواب بده.

اگر سوال خارج از حوزه تکنولوژی بود، کوتاه و طبیعی بگو:
«من بیشتر توی حوزه تکنولوژی و برنامه‌نویسی‌ام.»

مثال:

کاربر:
تو اسمت چیه؟

جواب:
من TechAI هستم.

کاربر:
چند سالته؟

جواب:
سن واقعی ندارم؛ من یه هوش مصنوعی‌ام.

کاربر:
حالت چطوره؟

جواب:
خوبم، تو چطوری؟

کاربر:
React و Next.js چه فرقی دارن؟

جواب:
React برای ساخت رابط کاربریه، ولی Next.js یه فریم‌ورکه که روی React ساخته شده و امکانات بیشتری مثل مسیریابی و رندر سمت سرور داره.
`,
        },
        ...messages,
      ],
      max_tokens: 500,
      temperature: 0.6,
    });

    const response =
      result.choices?.[0]?.message?.content?.trim() ||
      "پاسخی دریافت نشد.";

    return Response.json({ response });
  } catch (error) {
    console.error("TechAI API Error:", error);

    if (error.status === 401 || error.status === 403) {
      return Response.json(
        { response: "توکن اتصال به هوش مصنوعی مشکل داره." },
        { status: 500 }
      );
    }

    if (error.status === 429) {
      return Response.json(
        { response: "فعلاً درخواست‌ها زیاده. چند لحظه دیگه دوباره امتحان کن." },
        { status: 429 }
      );
    }

    return Response.json(
      { response: "ارتباط با هوش مصنوعی برقرار نشد. دوباره امتحان کن." },
      { status: 500 }
    );
  }
}