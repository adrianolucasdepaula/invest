
const fs = require('fs');
const path = require('path');

const resultsPath = path.join(__dirname, 'test-results.json');

try {
    if (!fs.existsSync(resultsPath)) {
        console.log('No test-results.json found.');
        process.exit(0);
    }

    const data = fs.readFileSync(resultsPath, 'utf8');
    const json = JSON.parse(data);

    const failures = [];

    function findFailures(suite) {
        if (suite.specs) {
            suite.specs.forEach(spec => {
                spec.tests.forEach(test => {
                    if (test.status === 'unexpected' || test.status === 'failed') {
                        // Clean up error message to be more readable
                        let errorMsg = test.results[0]?.error?.message || 'Unknown error';
                        // Remove ANSI codes
                        errorMsg = errorMsg.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

                        failures.push({
                            title: spec.title,
                            file: suite.file,
                            error: errorMsg
                        });
                    }
                });
            });
        }
        if (suite.suites) {
            suite.suites.forEach(childSuite => findFailures(childSuite));
        }
    }

    json.suites.forEach(findFailures);

    console.log(JSON.stringify(failures, null, 2));

} catch (e) {
    console.error('Error parsing results:', e);
}
