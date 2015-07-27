#HR, 07-27-15
#Uncertainty map
#Data source: http://www.census.gov/did/www/saipe/data/statecounty/data/2013.html
#No data for Kalawao HI

require(dplyr)

dt<-read.csv("data/poverty2013.csv",header=T, stringsAsFactors = FALSE)
dt$countyfip<-paste(dt$statefip, formatC(dt$county, width=3, flag="0"), sep="")
dt<-dt %>% arrange(statefip,county) %>%
  mutate(pov = poverty_pct/100, pov_lo = poverty_lo/100, pov_hi = poverty_hi/100, margin = pov - pov_lo) %>%
  select( -c(poverty_lo,poverty_hi,poverty_pct)) %>% select(countyfip,everything())

#Save separate state/national and county CSVs
states<-filter(dt,county==0)
counties<-filter(dt,county !=0)
write.csv(states, file="data/pov13_states.csv", row.names=FALSE)
write.csv(counties, file="data/pov13_counties.csv", row.names=FALSE)