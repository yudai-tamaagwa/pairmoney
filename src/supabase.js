import {
    testSupabaseConnection
} from "./lib/supabase";
import {
    createClient
} from "@supabase/supabase-js";

const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Supabase接続テスト
export async function testSupabaseConnection() {
    const {
        error
    } = await supabase
        .from("households")
        .select("id")
        .limit(1);

    if (error) {
        console.error("Supabase接続テスト:", error.message);
    } else {
        console.log("Supabaseへの通信に成功しました！");
    }
}
testSupabaseConnection();