<?php
require __DIR__ . '/../vendor/autoload.php';

use Sse\Events\TimedEvent;
use Sse\SSE;
use Linfo\Linfo;

class SysEvent extends TimedEvent
{
    /**
     * the interval in seconds to get new data
     */
    public $period = 2;

    private $linfo;

    public function __construct()
    {
        $this->linfo = new Linfo;
    }

    /**
     * Get updated data
     */
    public function update()
    {
        $parser = $this->linfo->getParser();
        $parser->determineCPUPercentage();

        $ram = $parser->getRam();

        return json_encode([
            'cpu' => $parser->getCPUUsage(),
            'ram' => round(($ram['total'] - $ram['free']) / $ram['total'] * 100, 2),
        ]);
    }
}

$sse = new SSE();
// Close connection after 30s
$sse->exec_limit = 30;
$sse->addEventListener('server-info', new SysEvent());
$sse->start();
