import header from './components/header.js';
import { loadEnv } from './utils/envs.js';
import { setup } from './screens/setup.js';
import chat from './screens/chat.js';


export default async function cli(){
    console.clear()
    header()

    const env = loadEnv();
    
    if (!env){
        await setup();
    } else {
        chat()
    }

}