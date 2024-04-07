const api_url = 'https://mindicador.cl/api/';
let myChart = null;

const fetchData = async (url) => {
    const response = await fetch(url);
    return response.json();
};

const getFilteredCoins = async () => {
    try {
        const coins = await fetchData(api_url);
        const coinsFiltered = Object.keys(coins)
            .filter(indicador => coins[indicador]['unidad_medida'] === 'Pesos')
            .map(coin => ({
                codigo: coins[coin]['codigo'],
                nombre: coins[coin]['nombre'],
                valor: coins[coin]['valor']
            }));

        return coinsFiltered;
    } catch (error) {
        console.log(error);
        return [];
    }
};

const getCoinData = async (coin_name, limit = 10) => {
    
    try {
        const coins = await fetchData(`${api_url}${coin_name}`);
        return coins.serie.slice(0, limit);
        
    } catch (error) {
        console.log(error);
        return [];
    }
};

const getCoinPrice = async (coin_name) => {
    try {
        const coin = await fetchData(`${api_url}${coin_name}`);
        return coin.serie[0].valor;
    } catch (error) {
        console.log(error);
        return 0;
    }
};

const renderChart = (labels, data) => {
    const config = {
        type: 'line',
        data: {
            labels: labels,
            
            datasets: [{
                label: 'Indicadores',
                borderColor: 'rgb(255, 99, 132)',
                data: data,
                
            }]
        }
        
    };

    const ctx = document.getElementById('myChart').getContext('2d');
    ctx.canvas.style.backgroundColor = 'white';
    myChart = new Chart(ctx, config);
};

const updateCoinOptions = async () => {
    const coins_info = await getFilteredCoins();
    const selectContainer = document.querySelector('#coins');

    selectContainer.innerHTML = coins_info.map(coin => `
        <option value="${coin.codigo}">${coin.nombre}</option>
    `).join('');
};

const calcularConversion = async () => {
    const clpInput = document.querySelector('#clp');
    const clpValue = parseFloat(clpInput.value);

    if (isNaN(clpValue) || clpValue < 0) {
        const resultDiv = document.querySelector('#conversionResult');
        resultDiv.textContent = 'Por favor, ingresa un monto válido en Pesos CLP.';
        return; 
    }

    const coin_name = document.querySelector('#coins').value;
    const coin_value = await getCoinPrice(coin_name);

    const conversion = (clpValue / coin_value).toFixed(2);
    const resultDiv = document.querySelector('#conversionResult');
    resultDiv.textContent = `Resultado: ${conversion} ${coin_name}`;
    clpInput.value = ''; 
};


const handleCoinChange = async (event) => {
    const coin = event.target.value;
    document.getElementById('loading').innerText = 'Cargando...';

    if (myChart) {
        myChart.destroy();
    }

    const coinData = await getCoinData(coin);
    document.getElementById('loading').innerText = '';

    const labels = coinData.map(coin => coin.fecha);
    const data = coinData.map(coin => coin.valor);

    renderChart(labels, data);
};


document.addEventListener('DOMContentLoaded', async () => {
    await updateCoinOptions();
});

document.querySelector('#calcular').addEventListener('click', calcularConversion);

document.querySelector('#coins').addEventListener('change', handleCoinChange);
