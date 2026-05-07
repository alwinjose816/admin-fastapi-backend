export async function fetchAllData(supabase, tableName) {
    let allData = [];
    let from = 0;
    const batchSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from(tableName)
            .select("*")
            .range(from, from + batchSize - 1);

        if (error) {
            console.error(error);
            break;
        }

        if (!data || data.length === 0) break;

        allData = [...allData, ...data];

        if (data.length < batchSize) break;

        from += batchSize;
    }

    return allData;
}