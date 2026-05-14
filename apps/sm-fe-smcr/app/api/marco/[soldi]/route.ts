export async function GET(request: Request,
    { params }: { params: Promise<{ soldi: string }> },
) {
    const { soldi } = await params;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")
    // step di validazione dei dati....
    
    // step chiamate async a db a API ..... 

    // ritorno la risposta
    return new Response(`Mi pagano ${soldi} e devo inserirli nell'ID ${id}`, {status: 200})
}