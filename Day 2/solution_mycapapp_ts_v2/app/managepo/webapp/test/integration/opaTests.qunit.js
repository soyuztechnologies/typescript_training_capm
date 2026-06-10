sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'anubhav/ui/managepo/test/integration/FirstJourney',
		'anubhav/ui/managepo/test/integration/pages/PurchaseOrderSetList',
		'anubhav/ui/managepo/test/integration/pages/PurchaseOrderSetObjectPage',
		'anubhav/ui/managepo/test/integration/pages/PurchaseItemsSetObjectPage'
    ],
    function(JourneyRunner, opaJourney, PurchaseOrderSetList, PurchaseOrderSetObjectPage, PurchaseItemsSetObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('anubhav/ui/managepo') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onThePurchaseOrderSetList: PurchaseOrderSetList,
					onThePurchaseOrderSetObjectPage: PurchaseOrderSetObjectPage,
					onThePurchaseItemsSetObjectPage: PurchaseItemsSetObjectPage
                }
            },
            opaJourney.run
        );
    }
);